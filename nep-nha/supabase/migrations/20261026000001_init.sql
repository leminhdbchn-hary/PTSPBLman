-- =====================================================================================
-- Nếp Nhà — schema, hàm nghiệp vụ, Row Level Security và Storage
-- Chạy trong Supabase (SQL Editor hoặc `supabase db push`). Mọi dữ liệu gia đình đều gắn family_id
-- và chỉ thành viên của gia đình đó mới đọc/ghi được, kiểm tra ngay ở cơ sở dữ liệu (RLS).
-- =====================================================================================

-- ---------- kiểu dữ liệu ----------
create type public.family_role as enum ('owner', 'admin', 'contributor', 'viewer');
create type public.memory_visibility as enum ('family', 'admins', 'private');
create type public.media_kind as enum ('image', 'video', 'audio', 'document');
create type public.relationship_kind as enum ('parent', 'spouse');
create type public.letter_status as enum ('draft', 'sealed');

-- ---------- tiện ích ----------
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  avatar_path text,
  bio text check (bio is null or char_length(bio) <= 1000),
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- tự tạo hồ sơ khi có tài khoản mới
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 100))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- families & memberships ----------
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  description text check (description is null or char_length(description) <= 500),
  cover_path text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger families_touch before update on public.families for each row execute function public.touch_updated_at();

create table public.family_memberships (
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.family_role not null default 'contributor',
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);
create index family_memberships_user_idx on public.family_memberships (user_id);

-- ---------- hàm kiểm tra quyền (security definer để tránh đệ quy RLS) ----------
create function public.family_role_of(fid uuid) returns public.family_role
language sql stable security definer set search_path = public as $$
  select role from public.family_memberships where family_id = fid and user_id = auth.uid()
$$;
create function public.is_member(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_memberships where family_id = fid and user_id = auth.uid())
$$;
create function public.can_contribute(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_memberships where family_id = fid and user_id = auth.uid() and role in ('owner', 'admin', 'contributor'))
$$;
create function public.is_admin(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_memberships where family_id = fid and user_id = auth.uid() and role in ('owner', 'admin'))
$$;
create function public.is_owner(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_memberships where family_id = fid and user_id = auth.uid() and role = 'owner')
$$;
-- hai người dùng có chung một gia đình không (để xem hồ sơ của nhau)
create function public.shares_family_with(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.family_memberships a join public.family_memberships b on a.family_id = b.family_id
    where a.user_id = auth.uid() and b.user_id = uid)
$$;

-- luôn còn ít nhất một chủ sở hữu (trừ khi cả gia đình bị xoá)
create function public.keep_one_owner() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'owner' and (tg_op = 'DELETE' or new.role <> 'owner') then
    if exists (select 1 from public.families where id = old.family_id)
       and not exists (select 1 from public.family_memberships where family_id = old.family_id and role = 'owner' and user_id <> old.user_id) then
      raise exception 'Gia đình phải còn ít nhất một chủ sở hữu. Hãy chuyển quyền chủ sở hữu trước.' using errcode = 'P0001';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end $$;
create trigger memberships_keep_owner before update or delete on public.family_memberships for each row execute function public.keep_one_owner();

-- ---------- hồ sơ thành viên (người trong gia đình, có thể chưa có tài khoản) ----------
create table public.people (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 100),
  relation_label text check (relation_label is null or char_length(relation_label) <= 40),
  birth_date date,
  birth_date_visible boolean not null default false,
  bio text check (bio is null or char_length(bio) <= 3000),
  avatar_path text,
  is_demo boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, family_id),
  unique (family_id, user_id)
);
create index people_family_idx on public.people (family_id, full_name);
create trigger people_touch before update on public.people for each row execute function public.touch_updated_at();

create table public.family_relationships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null,
  person_a uuid not null,   -- kind = parent: person_a là cha/mẹ của person_b ; kind = spouse: vợ/chồng (person_a < person_b)
  person_b uuid not null,
  kind public.relationship_kind not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (person_a, family_id) references public.people (id, family_id) on delete cascade,
  foreign key (person_b, family_id) references public.people (id, family_id) on delete cascade,
  check (person_a <> person_b),
  check (kind <> 'spouse' or person_a < person_b),
  unique (family_id, kind, person_a, person_b)
);
create index family_relationships_a_idx on public.family_relationships (person_a);
create index family_relationships_b_idx on public.family_relationships (person_b);

-- chống vòng lặp quan hệ cha/mẹ - con và quan hệ vô lý
create function public.check_relationship() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.kind = 'parent' then
    -- person_b không được là tổ tiên của person_a (nếu không sẽ tạo vòng lặp)
    if exists (
      with recursive anc(id) as (
        select new.person_a
        union
        select r.person_a from public.family_relationships r join anc on r.person_b = anc.id and r.kind = 'parent'
      ) select 1 from anc where id = new.person_b) then
      raise exception 'Quan hệ này tạo vòng lặp trong gia phả.' using errcode = 'P0001';
    end if;
    -- tối đa 2 cha/mẹ cho mỗi người
    if (select count(*) from public.family_relationships where person_b = new.person_b and kind = 'parent') >= 2 then
      raise exception 'Mỗi người chỉ có tối đa 2 cha/mẹ.' using errcode = 'P0001';
    end if;
  end if;
  if new.kind = 'spouse' and exists (
    select 1 from public.family_relationships r where r.kind = 'parent'
      and ((r.person_a = new.person_a and r.person_b = new.person_b) or (r.person_a = new.person_b and r.person_b = new.person_a))) then
    raise exception 'Hai người đã có quan hệ cha/mẹ - con, không thể là vợ chồng.' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger relationships_check before insert on public.family_relationships for each row execute function public.check_relationship();

-- không cho đổi gia đình / người tạo của một dòng (chặn "chuyển" dữ liệu sang gia đình khác)
create function public.lock_family_and_creator() returns trigger language plpgsql as $$
begin
  if new.family_id is distinct from old.family_id then raise exception 'Không thể đổi gia đình của dữ liệu.' using errcode = '42501'; end if;
  if to_jsonb(new) ->> 'created_by' is not null and to_jsonb(new) ->> 'created_by' is distinct from to_jsonb(old) ->> 'created_by' then raise exception 'Không thể đổi người tạo.' using errcode = '42501'; end if;
  return new;
end $$;
create trigger people_lock before update on public.people for each row execute function public.lock_family_and_creator();

-- hồ sơ chỉ được gắn với tài khoản đang là thành viên của chính gia đình đó
create function public.check_person_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is not null and not exists (select 1 from public.family_memberships where family_id = new.family_id and user_id = new.user_id) then
    raise exception 'Tài khoản này không thuộc gia đình.' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger people_user_check before insert or update of user_id on public.people for each row execute function public.check_person_user();

-- ---------- ký ức ----------
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 140),
  body text not null default '' check (char_length(body) <= 10000),
  happened_on date,
  location text check (location is null or char_length(location) <= 120),
  tags text[] not null default '{}' check (coalesce(array_length(tags, 1), 0) <= 8),
  visibility public.memory_visibility not null default 'family',
  is_demo boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, family_id)
);
create index memories_timeline_idx on public.memories (family_id, happened_on desc nulls last, created_at desc);
create index memories_tags_idx on public.memories using gin (tags);
create trigger memories_touch before update on public.memories for each row execute function public.touch_updated_at();
create trigger memories_lock before update on public.memories for each row execute function public.lock_family_and_creator();

create table public.memory_people (
  memory_id uuid not null,
  person_id uuid not null,
  family_id uuid not null,
  primary key (memory_id, person_id),
  foreign key (memory_id, family_id) references public.memories (id, family_id) on delete cascade,
  foreign key (person_id, family_id) references public.people (id, family_id) on delete cascade
);
create index memory_people_person_idx on public.memory_people (person_id);

create table public.memory_media (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null,
  family_id uuid not null,
  storage_path text not null unique,       -- 'demo:/demo/xxx.svg' cho ảnh minh hoạ của dữ liệu mẫu
  kind public.media_kind not null default 'image',
  mime_type text not null,
  size_bytes integer not null check (size_bytes >= 0),
  width integer,
  height integer,
  caption text check (caption is null or char_length(caption) <= 300),
  sort_order integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (memory_id, family_id) references public.memories (id, family_id) on delete cascade
);
create index memory_media_memory_idx on public.memory_media (memory_id, sort_order);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null,
  family_id uuid not null,
  author_id uuid references auth.users (id) on delete set null,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  foreign key (memory_id, family_id) references public.memories (id, family_id) on delete cascade
);
create index comments_memory_idx on public.comments (memory_id, created_at);

-- ---------- lời kể & thư (giai đoạn sau, schema đã sẵn) ----------
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 140),
  teller_person_id uuid,
  transcript text not null default '' check (char_length(transcript) <= 20000),
  audio_path text,
  recorded_at timestamptz,
  memory_id uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (teller_person_id, family_id) references public.people (id, family_id) on delete set null (teller_person_id),
  foreign key (memory_id, family_id) references public.memories (id, family_id) on delete set null (memory_id)
);
create index stories_family_idx on public.stories (family_id, created_at desc);
create trigger stories_touch before update on public.stories for each row execute function public.touch_updated_at();
create trigger stories_lock before update on public.stories for each row execute function public.lock_family_and_creator();

create table public.letters (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  recipient_person_id uuid,                -- null = gửi cả gia đình
  title text not null check (char_length(btrim(title)) between 1 and 140),
  body text not null default '' check (char_length(body) <= 20000),
  open_on date not null,
  status public.letter_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (recipient_person_id, family_id) references public.people (id, family_id)   -- không tự biến thư riêng thành thư gửi cả nhà khi xoá hồ sơ người nhận
);
create index letters_family_idx on public.letters (family_id, open_on);
create trigger letters_touch before update on public.letters for each row execute function public.touch_updated_at();

-- ---------- lời mời ----------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  email text check (email is null or char_length(email) <= 254),
  role public.family_role not null default 'contributor' check (role <> 'owner'),
  token_hash text not null unique,         -- sha256 của mã mời; mã gốc chỉ nằm trong liên kết gửi cho người được mời
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index invitations_family_idx on public.invitations (family_id, created_at desc);

-- ---------- yêu cầu xoá tài khoản ----------
create table public.account_deletion_requests (
  user_id uuid primary key references auth.users (id) on delete cascade,
  requested_at timestamptz not null default now(),
  reason text check (reason is null or char_length(reason) <= 500),
  handled_at timestamptz
);

-- =====================================================================================
-- Hàm nghiệp vụ (security definer, tự kiểm tra quyền bên trong)
-- =====================================================================================
create function public.create_family(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid; uid uuid := auth.uid(); nm text := btrim(coalesce(p_name, ''));
begin
  if uid is null then raise exception 'Bạn cần đăng nhập.' using errcode = '42501'; end if;
  if char_length(nm) not between 1 and 80 then raise exception 'Tên gia đình cần từ 1 đến 80 ký tự.' using errcode = '22023'; end if;
  insert into public.families (name, created_by) values (nm, uid) returning id into fid;
  insert into public.family_memberships (family_id, user_id, role) values (fid, uid, 'owner');
  insert into public.people (family_id, user_id, full_name, relation_label, created_by)
    select fid, uid, coalesce(nullif(btrim(p.full_name), ''), 'Tôi'), null, uid from public.profiles p where p.id = uid;
  return fid;
end $$;

create function public.set_member_role(p_family uuid, p_user uuid, p_role public.family_role) returns void
language plpgsql security definer set search_path = public as $$
declare my public.family_role := public.family_role_of(p_family); target public.family_role;
begin
  if my is null or my not in ('owner', 'admin') then raise exception 'Bạn không có quyền đổi vai trò.' using errcode = '42501'; end if;
  select role into target from public.family_memberships where family_id = p_family and user_id = p_user;
  if target is null then raise exception 'Không tìm thấy thành viên.' using errcode = 'P0002'; end if;
  if p_role = 'owner' then raise exception 'Dùng chức năng chuyển quyền chủ sở hữu.' using errcode = '22023'; end if;
  if target = 'owner' then raise exception 'Không thể hạ vai trò của chủ sở hữu. Hãy chuyển quyền trước.' using errcode = '42501'; end if;
  if my = 'admin' and (target = 'admin' or p_role = 'admin') then raise exception 'Chỉ chủ sở hữu mới đổi vai trò quản trị viên.' using errcode = '42501'; end if;
  update public.family_memberships set role = p_role where family_id = p_family and user_id = p_user;
end $$;

create function public.remove_member(p_family uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare my public.family_role := public.family_role_of(p_family); target public.family_role;
begin
  select role into target from public.family_memberships where family_id = p_family and user_id = p_user;
  if target is null then raise exception 'Không tìm thấy thành viên.' using errcode = 'P0002'; end if;
  if p_user <> auth.uid() then
    if my is null or my not in ('owner', 'admin') then raise exception 'Bạn không có quyền xoá thành viên.' using errcode = '42501'; end if;
    if target = 'owner' or (my = 'admin' and target = 'admin') then raise exception 'Bạn không thể xoá người này.' using errcode = '42501'; end if;
  end if;
  delete from public.family_memberships where family_id = p_family and user_id = p_user;
  update public.people set user_id = null where family_id = p_family and user_id = p_user;
end $$;

create function public.transfer_ownership(p_family uuid, p_new_owner uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(p_family) then raise exception 'Chỉ chủ sở hữu mới chuyển được quyền.' using errcode = '42501'; end if;
  if not exists (select 1 from public.family_memberships where family_id = p_family and user_id = p_new_owner) then
    raise exception 'Người nhận quyền phải là thành viên của gia đình.' using errcode = 'P0002'; end if;
  update public.family_memberships set role = 'owner' where family_id = p_family and user_id = p_new_owner;
  update public.family_memberships set role = 'admin' where family_id = p_family and user_id = auth.uid() and user_id <> p_new_owner;
end $$;

create function public.delete_family(p_family uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner(p_family) then raise exception 'Chỉ chủ sở hữu mới xoá được gia đình.' using errcode = '42501'; end if;
  delete from public.families where id = p_family;
end $$;

-- xem trước lời mời (cho trang /invite/[token]); chỉ trả thông tin tối thiểu và chỉ khi mã đúng
create function public.preview_invitation(p_token text)
returns table (family_name text, role public.family_role, expires_at timestamptz, valid boolean)
language sql stable security definer set search_path = public as $$
  select f.name, i.role, i.expires_at,
         (i.accepted_at is null and i.revoked_at is null and i.expires_at > now()) as valid
  from public.invitations i join public.families f on f.id = i.family_id
  where i.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
$$;

create function public.accept_invitation(p_token text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv public.invitations; uid uuid := auth.uid(); mail text;
begin
  if uid is null then raise exception 'Bạn cần đăng nhập để nhận lời mời.' using errcode = '42501'; end if;
  select * into inv from public.invitations where token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex') for update;
  if not found then raise exception 'Lời mời không tồn tại.' using errcode = 'P0002'; end if;
  if inv.revoked_at is not null then raise exception 'Lời mời đã bị thu hồi.' using errcode = '22023'; end if;
  if inv.accepted_at is not null then raise exception 'Lời mời đã được sử dụng.' using errcode = '22023'; end if;
  if inv.expires_at <= now() then raise exception 'Lời mời đã hết hạn.' using errcode = '22023'; end if;
  if inv.email is not null then
    select lower(email) into mail from auth.users where id = uid;
    if mail is distinct from lower(inv.email) then raise exception 'Lời mời này dành cho một địa chỉ email khác.' using errcode = '42501'; end if;
  end if;
  insert into public.family_memberships (family_id, user_id, role) values (inv.family_id, uid, inv.role)
    on conflict (family_id, user_id) do nothing;
  insert into public.people (family_id, user_id, full_name, created_by)
    select inv.family_id, uid, coalesce(nullif(btrim(p.full_name), ''), 'Thành viên mới'), uid from public.profiles p where p.id = uid
    on conflict (family_id, user_id) do nothing;
  update public.invitations set accepted_by = uid, accepted_at = now() where id = inv.id;
  return inv.family_id;
end $$;

create function public.request_account_deletion(p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Bạn cần đăng nhập.' using errcode = '42501'; end if;
  insert into public.account_deletion_requests (user_id, reason) values (auth.uid(), left(p_reason, 500))
    on conflict (user_id) do update set requested_at = now(), reason = excluded.reason, handled_at = null;
  update public.profiles set deletion_requested_at = now() where id = auth.uid();
end $$;

create function public.cancel_account_deletion() returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.account_deletion_requests where user_id = auth.uid() and handled_at is null;
  update public.profiles set deletion_requested_at = null where id = auth.uid();
end $$;

-- danh bạ thành viên của một gia đình, ngày sinh chỉ hiện với: người được phép xem (đã bật hiển thị), người tạo hồ sơ, chính chủ và quản trị
create function public.people_directory(p_family uuid)
returns table (id uuid, family_id uuid, user_id uuid, full_name text, relation_label text, birth_date date, birth_date_visible boolean,
               bio text, avatar_path text, is_demo boolean, created_by uuid)
language sql stable security definer set search_path = public as $$
  select p.id, p.family_id, p.user_id, p.full_name, p.relation_label,
         case when p.birth_date_visible or p.created_by = auth.uid() or p.user_id = auth.uid() or public.is_admin(p.family_id) then p.birth_date end,
         p.birth_date_visible, p.bio, p.avatar_path, p.is_demo, p.created_by
  from public.people p
  where p.family_id = p_family and public.is_member(p_family)
$$;

-- =====================================================================================
-- Row Level Security
-- =====================================================================================
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_memberships enable row level security;
alter table public.people enable row level security;
alter table public.family_relationships enable row level security;
alter table public.memories enable row level security;
alter table public.memory_people enable row level security;
alter table public.memory_media enable row level security;
alter table public.comments enable row level security;
alter table public.stories enable row level security;
alter table public.letters enable row level security;
alter table public.invitations enable row level security;
alter table public.account_deletion_requests enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_family_with(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- families (tạo/xoá đi qua hàm create_family / delete_family)
create policy families_select on public.families for select to authenticated using (public.is_member(id));
create policy families_update on public.families for update to authenticated
  using (public.is_admin(id)) with check (public.is_admin(id));

-- memberships: chỉ đọc trực tiếp; thay đổi qua hàm
create policy memberships_select on public.family_memberships for select to authenticated using (public.is_member(family_id));

-- people
create policy people_select on public.people for select to authenticated using (public.is_member(family_id));
create policy people_insert on public.people for insert to authenticated
  with check (public.can_contribute(family_id) and created_by = auth.uid());
create policy people_update on public.people for update to authenticated
  using (public.is_admin(family_id) or (public.can_contribute(family_id) and (created_by = auth.uid() or user_id = auth.uid())))
  with check (public.can_contribute(family_id));
create policy people_delete on public.people for delete to authenticated
  using (public.is_admin(family_id) or (public.can_contribute(family_id) and created_by = auth.uid() and user_id is null));

-- family_relationships
create policy relationships_select on public.family_relationships for select to authenticated using (public.is_member(family_id));
create policy relationships_insert on public.family_relationships for insert to authenticated
  with check (public.can_contribute(family_id) and created_by = auth.uid());
create policy relationships_delete on public.family_relationships for delete to authenticated
  using (public.is_admin(family_id) or (public.can_contribute(family_id) and created_by = auth.uid()));

-- memories: thành viên đọc theo chế độ hiển thị; người đóng góp tạo; tác giả hoặc quản trị sửa/xoá
create policy memories_select on public.memories for select to authenticated
  using (public.is_member(family_id) and (visibility = 'family' or created_by = auth.uid() or (visibility = 'admins' and public.is_admin(family_id))));
create policy memories_insert on public.memories for insert to authenticated
  with check (public.can_contribute(family_id) and created_by = auth.uid());
create policy memories_update on public.memories for update to authenticated
  using (public.can_contribute(family_id) and (created_by = auth.uid() or public.is_admin(family_id)))
  with check (public.can_contribute(family_id));
create policy memories_delete on public.memories for delete to authenticated
  using (public.can_contribute(family_id) and (created_by = auth.uid() or public.is_admin(family_id)));

-- bảng con của ký ức: đọc được khi đọc được ký ức; ghi khi được sửa ký ức
create policy memory_people_select on public.memory_people for select to authenticated
  using (exists (select 1 from public.memories m where m.id = memory_people.memory_id));
create policy memory_people_write on public.memory_people for all to authenticated
  using (exists (select 1 from public.memories m where m.id = memory_people.memory_id and public.can_contribute(m.family_id) and (m.created_by = auth.uid() or public.is_admin(m.family_id))))
  with check (exists (select 1 from public.memories m where m.id = memory_people.memory_id and public.can_contribute(m.family_id) and (m.created_by = auth.uid() or public.is_admin(m.family_id))));

create policy memory_media_select on public.memory_media for select to authenticated
  using (exists (select 1 from public.memories m where m.id = memory_media.memory_id));
create policy memory_media_write on public.memory_media for all to authenticated
  using (exists (select 1 from public.memories m where m.id = memory_media.memory_id and public.can_contribute(m.family_id) and (m.created_by = auth.uid() or public.is_admin(m.family_id))))
  with check (exists (select 1 from public.memories m where m.id = memory_media.memory_id and public.can_contribute(m.family_id) and (m.created_by = auth.uid() or public.is_admin(m.family_id))));

-- comments
create policy comments_select on public.comments for select to authenticated
  using (exists (select 1 from public.memories m where m.id = comments.memory_id));
create policy comments_insert on public.comments for insert to authenticated
  with check (author_id = auth.uid() and public.can_contribute(family_id) and exists (select 1 from public.memories m where m.id = comments.memory_id));
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_admin(family_id));

-- stories
create policy stories_select on public.stories for select to authenticated using (public.is_member(family_id));
create policy stories_insert on public.stories for insert to authenticated
  with check (public.can_contribute(family_id) and created_by = auth.uid());
create policy stories_update on public.stories for update to authenticated
  using (public.can_contribute(family_id) and (created_by = auth.uid() or public.is_admin(family_id))) with check (public.can_contribute(family_id));
create policy stories_delete on public.stories for delete to authenticated
  using (public.can_contribute(family_id) and (created_by = auth.uid() or public.is_admin(family_id)));

-- letters: người nhận KHÔNG nhận được dòng dữ liệu nào (kể cả nội dung) cho tới ngày mở thư — chặn ngay ở cơ sở dữ liệu
create policy letters_select on public.letters for select to authenticated
  using (
    author_id = auth.uid()
    or (
      status = 'sealed' and open_on <= current_date and public.is_member(family_id)
      and (recipient_person_id is null
           or exists (select 1 from public.people p where p.id = letters.recipient_person_id and p.user_id = auth.uid()))
    ));
create policy letters_insert on public.letters for insert to authenticated
  with check (author_id = auth.uid() and public.can_contribute(family_id));
create policy letters_update on public.letters for update to authenticated
  using (author_id = auth.uid() and status = 'draft') with check (author_id = auth.uid() and public.can_contribute(family_id));
create policy letters_delete on public.letters for delete to authenticated using (author_id = auth.uid() and status = 'draft');

-- invitations: chỉ quản trị gia đình đọc / tạo / thu hồi; người được mời dùng hàm accept_invitation
create policy invitations_select on public.invitations for select to authenticated using (public.is_admin(family_id));
create policy invitations_insert on public.invitations for insert to authenticated
  with check (public.is_admin(family_id) and created_by = auth.uid());
create policy invitations_update on public.invitations for update to authenticated
  using (public.is_admin(family_id)) with check (public.is_admin(family_id));

create policy deletion_requests_select on public.account_deletion_requests for select to authenticated using (user_id = auth.uid());

-- =====================================================================================
-- Quyền truy cập bảng/hàm
-- =====================================================================================
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from public, anon;
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.families to authenticated;
grant select on public.family_memberships to authenticated;
grant select, insert, update, delete on public.family_relationships, public.memories, public.memory_people,
  public.memory_media, public.comments, public.stories, public.letters to authenticated;
-- people: ngày sinh là thông tin riêng tư nên KHÔNG cho đọc trực tiếp cột birth_date; đọc qua hàm people_directory (che ngày sinh theo quyền)
grant insert, update, delete on public.people to authenticated;
grant select (id, family_id, user_id, full_name, relation_label, birth_date_visible, bio, avatar_path, is_demo, created_by, created_at, updated_at) on public.people to authenticated;
grant select, insert, update on public.invitations to authenticated;
grant select on public.account_deletion_requests to authenticated;
-- Tệp trong Storage đã được gắn vào một ký ức nào đó chưa (kiểm tra thô, không áp RLS để quản trị viên không "thấy" được ảnh của ký ức riêng tư)
create or replace function public.media_attached(p text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memory_media where storage_path = p);
$$;
revoke all on function public.media_attached(text) from public;
grant execute on function public.media_attached(text) to authenticated;

grant execute on function public.family_role_of(uuid), public.is_member(uuid), public.can_contribute(uuid), public.is_admin(uuid),
  public.is_owner(uuid), public.shares_family_with(uuid), public.create_family(text), public.set_member_role(uuid, uuid, public.family_role),
  public.remove_member(uuid, uuid), public.transfer_ownership(uuid, uuid), public.delete_family(uuid), public.accept_invitation(text),
  public.request_account_deletion(text), public.cancel_account_deletion(), public.people_directory(uuid), public.media_attached(text) to authenticated;
grant execute on function public.preview_invitation(text) to anon, authenticated;

-- =====================================================================================
-- Storage: bucket riêng tư, đường dẫn {family_id}/{loại}/...
-- =====================================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('family-media', 'family-media', false, 26214400,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy family_media_select on storage.objects for select to authenticated
  using (
    bucket_id = 'family-media'
    and public.is_member(((storage.foldername(name))[1])::uuid)
    and ((storage.foldername(name))[2] <> 'memories'
         or exists (select 1 from public.memory_media mm where mm.storage_path = name)   -- RLS của memory_media áp dụng chế độ hiển thị của ký ức
         -- tệp chưa gắn vào ký ức nào (vừa tải lên, hoặc ký ức đã bị xoá) chỉ người tải lên/quản trị viên thấy, để còn dọn dẹp được
         or (not public.media_attached(name) and (owner = auth.uid() or public.is_admin(((storage.foldername(name))[1])::uuid))))
  );
create policy family_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'family-media' and public.can_contribute(((storage.foldername(name))[1])::uuid));
create policy family_media_update on storage.objects for update to authenticated
  using (bucket_id = 'family-media' and owner = auth.uid() and public.can_contribute(((storage.foldername(name))[1])::uuid));
create policy family_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'family-media' and public.can_contribute(((storage.foldername(name))[1])::uuid)
         and (owner = auth.uid() or public.is_admin(((storage.foldername(name))[1])::uuid)));

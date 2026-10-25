// Kiểm thử phân quyền (RLS) trên một PostgreSQL thật chạy tạm trong máy (embedded-postgres).
// Không cần Supabase: file này dựng sẵn schema `auth` / `storage` giả lập giống Supabase rồi chạy migration thật.
// Chạy: npm run test:rls
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const parent = fs.mkdtempSync(path.join(os.tmpdir(), "nepnha-pg-"));
fs.chmodSync(parent, 0o777); // chạy bằng root thì Postgres tự đổi sang user `postgres`: để nó tự tạo thư mục dữ liệu con
const dir = path.join(parent, "data");
const PORT = 54329;
const server = new EmbeddedPostgres({ databaseDir: dir, user: "postgres", password: "pw", port: PORT, persistent: false, onLog: () => {}, onError: () => {} });

let pass = 0, fail = 0;
const results = [];
function check(name, ok, detail = "") {
  (ok ? pass++ : fail++);
  results.push(`${ok ? "✔" : "✘"} ${name}${ok ? "" : "  ← " + detail}`);
}

async function main() {
  await server.initialise();
  await server.start();
  const admin = new pg.Client({ host: "localhost", port: PORT, user: "postgres", password: "pw", database: "postgres" });
  await admin.connect();

  // --- giả lập phần của Supabase mà migration phụ thuộc ---
  await admin.query(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid default auth.uid());
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$
      select (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)] $$;
    grant usage on schema auth, storage to anon, authenticated;
    grant execute on function auth.uid(), storage.foldername(text) to anon, authenticated;
    grant select, insert, update, delete on storage.objects to authenticated;
  `);
  const migrations = fs.readdirSync(path.join(here, "../supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const f of migrations) await admin.query(fs.readFileSync(path.join(here, "../supabase/migrations", f), "utf8"));
  check(`chạy ${migrations.length} migration thành công`, true);

  // --- 3 người dùng: An & Bình (gia đình A), Chi (gia đình B), Dũng (chưa vào gia đình nào) ---
  const U = {};
  for (const [k, mail] of [["an", "an@x.vn"], ["binh", "binh@x.vn"], ["chi", "chi@x.vn"], ["dung", "dung@x.vn"], ["em", "em@x.vn"]]) {
    const r = await admin.query("insert into auth.users (email, raw_user_meta_data) values ($1, jsonb_build_object('full_name', $2::text)) returning id", [mail, k.toUpperCase()]);
    U[k] = r.rows[0].id;
  }
  check("tự tạo profile khi có tài khoản mới", (await admin.query("select count(*)::int c from public.profiles")).rows[0].c === 5);

  // chạy một câu lệnh dưới danh nghĩa một người dùng đã đăng nhập (RLS áp dụng)
  async function as(user, fn) {
    const c = new pg.Client({ host: "localhost", port: PORT, user: "postgres", password: "pw", database: "postgres" });
    await c.connect();
    await c.query("begin");
    await c.query("set local role authenticated");
    await c.query("select set_config('request.jwt.claim.sub', $1, true)", [user ? U[user] : ""]);
    const q = async (sql, params) => c.query(sql, params);
    // thử: trả về {ok, rows} hoặc {ok:false, err}
    const t = async (sql, params) => {
      await c.query("savepoint s");
      try { const r = await c.query(sql, params); await c.query("release savepoint s"); return { ok: true, rows: r.rows, count: r.rowCount }; }
      catch (e) { await c.query("rollback to savepoint s"); return { ok: false, err: e.message }; }
    };
    try { return await fn({ q, t }); } finally { await c.query("commit").catch(() => {}); await c.end(); }
  }

  // --- tạo gia đình ---
  let famA, famB;
  await as("an", async ({ q }) => { famA = (await q("select public.create_family($1) id", ["Nhà An"])).rows[0].id; });
  await as("chi", async ({ q }) => { famB = (await q("select public.create_family($1) id", ["Nhà Chi"])).rows[0].id; });
  check("tạo gia đình và chủ sở hữu", (await admin.query("select role from public.family_memberships where family_id=$1 and user_id=$2", [famA, U.an])).rows[0]?.role === "owner");

  // --- lời mời ---
  const token = "tok_" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  await as("an", async ({ t }) => {
    const r = await t(`insert into public.invitations (family_id, email, role, token_hash, created_by, expires_at)
      values ($1, null, 'contributor', encode(sha256(convert_to($2,'UTF8')),'hex'), auth.uid(), now() + interval '7 days')`, [famA, token]);
    check("quản trị tạo được lời mời", r.ok, r.err);
  });
  await as("chi", async ({ t }) => {
    const r = await t(`insert into public.invitations (family_id, role, token_hash, created_by, expires_at) values ($1, 'admin', 'x1', auth.uid(), now() + interval '7 days')`, [famA]);
    check("người ngoài KHÔNG tạo được lời mời cho gia đình khác", !r.ok);
    const s = await t("select * from public.invitations");
    check("người ngoài không đọc được lời mời của gia đình khác", s.rows.length === 0);
  });
  await as("binh", async ({ t }) => {
    const bad = await t("select public.accept_invitation($1)", ["sai-ma"]);
    check("mã mời sai bị từ chối", !bad.ok);
    const ok = await t("select public.accept_invitation($1) id", [token]);
    check("nhận lời mời đúng mã", ok.ok && ok.rows[0].id === famA, ok.err);
    const again = await t("select public.accept_invitation($1)", [token]);
    check("lời mời chỉ dùng được một lần", !again.ok);
  });
  // lời mời theo email
  const tokenE = "tok_" + Math.random().toString(36).slice(2);
  await as("an", async ({ t }) => { await t(`insert into public.invitations (family_id, email, role, token_hash, created_by, expires_at) values ($1, 'em@x.vn', 'viewer', encode(sha256(convert_to($2,'UTF8')),'hex'), auth.uid(), now() + interval '7 days')`, [famA, tokenE]); });
  await as("dung", async ({ t }) => { const r = await t("select public.accept_invitation($1)", [tokenE]); check("lời mời gắn email không dùng được bởi email khác", !r.ok); });
  await as("em", async ({ t }) => { const r = await t("select public.accept_invitation($1)", [tokenE]); check("đúng email thì nhận được lời mời", r.ok, r.err); });
  // lời mời hết hạn / thu hồi
  const tokenX = "tok_exp";
  await admin.query(`insert into public.invitations (family_id, role, token_hash, created_by, expires_at) values ($1,'viewer',encode(sha256(convert_to($2,'UTF8')),'hex'),$3, now() - interval '1 minute')`, [famA, tokenX, U.an]);
  await as("dung", async ({ t }) => { const r = await t("select public.accept_invitation($1)", [tokenX]); check("lời mời hết hạn bị từ chối", !r.ok); });
  const tokenR = "tok_rev";
  await admin.query(`insert into public.invitations (family_id, role, token_hash, created_by, expires_at, revoked_at) values ($1,'viewer',encode(sha256(convert_to($2,'UTF8')),'hex'),$3, now() + interval '1 day', now())`, [famA, tokenR, U.an]);
  await as("dung", async ({ t }) => { const r = await t("select public.accept_invitation($1)", [tokenR]); check("lời mời đã thu hồi bị từ chối", !r.ok); });

  // --- ký ức ---
  let memA, memAprivate, memAadmin, memB;
  await as("an", async ({ q, t }) => {
    memA = (await q("insert into public.memories (family_id, title, body, happened_on, created_by, tags) values ($1,'Bữa cơm chiều','nội dung', '2024-05-01', auth.uid(), '{Ăn uống}') returning id", [famA])).rows[0].id;
    memAprivate = (await q("insert into public.memories (family_id, title, visibility, created_by) values ($1,'Riêng của An','private', auth.uid()) returning id", [famA])).rows[0].id;
    memAadmin = (await q("insert into public.memories (family_id, title, visibility, created_by) values ($1,'Chỉ quản trị','admins', auth.uid()) returning id", [famA])).rows[0].id;
    await q("insert into public.memory_media (memory_id, family_id, storage_path, mime_type, size_bytes, created_by) values ($1,$2,$3,'image/jpeg',1000,auth.uid())", [memA, famA, `${famA}/memories/${memA}/a.jpg`]);
    await q("insert into public.memory_media (memory_id, family_id, storage_path, mime_type, size_bytes, created_by) values ($1,$2,$3,'image/jpeg',1000,auth.uid())", [memAprivate, famA, `${famA}/memories/${memAprivate}/p.jpg`]);
    const bad = await t("insert into public.memories (family_id, title, created_by) values ($1,'giả mạo', $2)", [famA, U.binh]);
    check("không được tạo ký ức mạo danh người khác", !bad.ok);
  });
  await as("chi", async ({ q }) => { memB = (await q("insert into public.memories (family_id, title, created_by) values ($1,'Của nhà Chi', auth.uid()) returning id", [famB])).rows[0].id; });

  await as("binh", async ({ t }) => { // Bình: thành viên đóng góp của gia đình A
    const l = (await t("select title from public.memories order by title")).rows.map((r) => r.title);
    check("thành viên thấy ký ức chế độ 'gia đình'", l.includes("Bữa cơm chiều"));
    check("thành viên KHÔNG thấy ký ức riêng của người khác", !l.includes("Riêng của An"));
    check("thành viên thường KHÔNG thấy ký ức 'chỉ quản trị'", !l.includes("Chỉ quản trị"));
    check("KHÔNG truy cập chéo sang gia đình khác bằng cách đoán id", (await t("select * from public.memories where id=$1", [memB])).rows.length === 0);
    check("không sửa được ký ức của người khác", (await t("update public.memories set title='hack' where id=$1", [memA])).count === 0);
    check("không xoá được ký ức của người khác", (await t("delete from public.memories where id=$1", [memA])).count === 0);
    const ins = await t("insert into public.memories (family_id, title, created_by) values ($1,'Chèn vào nhà khác',auth.uid())", [famB]);
    check("KHÔNG tạo được ký ức trong gia đình khác", !ins.ok);
    const own = await t("insert into public.memories (family_id, title, created_by) values ($1,'Của Bình',auth.uid()) returning id", [famA]);
    check("đóng góp được ký ức của mình", own.ok, own.err);
    const mv = await t("update public.memories set family_id=$1 where id=$2", [famB, own.rows[0]?.id]);
    check("không chuyển được ký ức sang gia đình khác", !mv.ok || mv.count === 0);
    check("không đọc được ảnh của ký ức riêng", (await t("select * from public.memory_media where memory_id=$1", [memAprivate])).rows.length === 0);
    check("đọc được ảnh của ký ức gia đình", (await t("select * from public.memory_media where memory_id=$1", [memA])).rows.length === 1);
  });
  await as("an", async ({ t }) => { // chủ sở hữu thấy ký ức "chỉ quản trị"
    const l = (await t("select title from public.memories")).rows.map((r) => r.title);
    check("quản trị thấy ký ức 'chỉ quản trị'", l.includes("Chỉ quản trị"));
  });
  await as("em", async ({ t }) => { // chỉ xem
    const ins = await t("insert into public.memories (family_id, title, created_by) values ($1,'viewer thử ghi',auth.uid())", [famA]);
    check("thành viên chỉ-xem KHÔNG ghi được ký ức", !ins.ok);
    check("thành viên chỉ-xem đọc được ký ức gia đình", (await t("select * from public.memories where id=$1", [memA])).rows.length === 1);
  });
  await as("dung", async ({ t }) => { // chưa thuộc gia đình nào
    check("người chưa vào gia đình không thấy ký ức nào", (await t("select * from public.memories")).rows.length === 0);
    check("người chưa vào gia đình không thấy gia đình nào", (await t("select * from public.families")).rows.length === 0);
    check("người chưa vào gia đình không thấy thành viên", (await t("select * from public.family_memberships")).rows.length === 0);
  });
  await as(null, async ({ t }) => {
    const r = await t("select * from public.memories");
    check("chưa đăng nhập không đọc được gì", !r.ok || r.rows.length === 0);
  });

  // --- storage ---
  await admin.query("insert into storage.objects (bucket_id, name, owner) values ('family-media', $1, $2), ('family-media', $3, $2)", [`${famA}/memories/${memA}/a.jpg`, U.an, `${famA}/memories/${memAprivate}/p.jpg`]);
  await as("binh", async ({ t }) => {
    const l = (await t("select name from storage.objects where bucket_id='family-media'")).rows.map((r) => r.name);
    check("thành viên đọc được file ảnh của ký ức gia đình", l.some((n) => n.includes(`/${memA}/`)));
    check("KHÔNG đọc được file ảnh của ký ức riêng tư", !l.some((n) => n.includes(`/${memAprivate}/`)));
    const up = await t("insert into storage.objects (bucket_id, name) values ('family-media', $1)", [`${famB}/memories/x/hack.jpg`]);
    check("KHÔNG tải file lên thư mục gia đình khác", !up.ok);
    const up2 = await t("insert into storage.objects (bucket_id, name) values ('family-media', $1)", [`${famA}/memories/${memA}/b.jpg`]);
    check("tải file lên thư mục gia đình mình được", up2.ok, up2.err);
    check("người tải lên thấy lại tệp chưa gắn vào ký ức (để dọn dẹp)", (await t("select 1 from storage.objects where name=$1", [`${famA}/memories/${memA}/b.jpg`])).rows.length === 1);
  });
  await as("an", async ({ t }) => {
    check("quản trị viên thấy tệp mồ côi (chưa gắn) để dọn dẹp", (await t("select 1 from storage.objects where name=$1", [`${famA}/memories/${memA}/b.jpg`])).rows.length === 1);
    check("tệp mồ côi xoá được và RETURNING trả về hàng", (await t("delete from storage.objects where name=$1 returning name", [`${famA}/memories/${memA}/b.jpg`])).rows.length === 1);
  });
  await as("chi", async ({ t }) => { check("người gia đình khác không thấy file", (await t("select * from storage.objects where bucket_id='family-media' and name like $1", [`${famA}/%`])).rows.length === 0); });
  await as("em", async ({ t }) => { const up = await t("insert into storage.objects (bucket_id, name) values ('family-media', $1)", [`${famA}/memories/${memA}/viewer.jpg`]); check("thành viên chỉ-xem không tải file lên được", !up.ok); });

  // --- vai trò & thành viên ---
  await as("binh", async ({ t }) => {
    check("thành viên thường không đổi được vai trò", !(await t("select public.set_member_role($1,$2,'admin')", [famA, U.em])).ok);
    check("thành viên thường không xoá được người khác", !(await t("select public.remove_member($1,$2)", [famA, U.em])).ok);
    const up = await t("update public.family_memberships set role='owner' where user_id=auth.uid()");
    check("không tự nâng quyền bằng UPDATE trực tiếp", !up.ok || up.count === 0, JSON.stringify(up));
    check("không thêm mình vào gia đình khác bằng INSERT trực tiếp", !(await t("insert into public.family_memberships (family_id,user_id,role) values ($1,auth.uid(),'owner')", [famB])).ok);
  });
  await as("an", async ({ t }) => {
    check("chủ sở hữu đổi vai trò thành viên", (await t("select public.set_member_role($1,$2,'admin')", [famA, U.binh])).ok);
    check("không hạ vai trò chủ sở hữu", !(await t("select public.set_member_role($1,$2,'viewer')", [famA, U.an])).ok);
    check("chủ sở hữu duy nhất không rời được", !(await t("select public.remove_member($1,$2)", [famA, U.an])).ok);
  });
  await as("binh", async ({ t }) => {
    check("quản trị viên không xoá được chủ sở hữu", !(await t("select public.remove_member($1,$2)", [famA, U.an])).ok);
    check("quản trị viên xoá được thành viên thường", (await t("select public.remove_member($1,$2)", [famA, U.em])).ok);
    check("quản trị viên không xoá được gia đình", !(await t("select public.delete_family($1)", [famA])).ok);
  });
  await as("an", async ({ t }) => {
    check("chuyển quyền chủ sở hữu", (await t("select public.transfer_ownership($1,$2)", [famA, U.binh])).ok);
  });
  await as("binh", async ({ t }) => { check("chủ mới có quyền chủ sở hữu", (await t("select public.family_role_of($1) r", [famA])).rows[0].r === "owner"); });

  // --- gia phả ---
  let pa, pb, pc, pd;
  await as("binh", async ({ q, t }) => {
    const mk = async (n) => (await q("insert into public.people (family_id, full_name, created_by) values ($1,$2,auth.uid()) returning id", [famA, n])).rows[0].id;
    pa = await mk("Ông"); pb = await mk("Bố"); pc = await mk("Con"); pd = await mk("Mẹ");
    const rel = (a, b, k = "parent") => t("insert into public.family_relationships (family_id, person_a, person_b, kind, created_by) values ($1,$2,$3,$4,auth.uid())", [famA, a, b, k]);
    check("thêm quan hệ cha/mẹ - con", (await rel(pa, pb)).ok);
    check("thêm quan hệ cha/mẹ - con (thế hệ 3)", (await rel(pb, pc)).ok);
    check("chặn vòng lặp gia phả (con làm cha của ông)", !(await rel(pc, pa)).ok);
    check("chặn tự làm cha mẹ của chính mình", !(await rel(pa, pa)).ok);
    check("thêm vợ/chồng", (await rel(pb < pd ? pb : pd, pb < pd ? pd : pb, "spouse")).ok);
    check("chặn cha/mẹ là vợ/chồng của con", !(await rel(pb < pc ? pb : pc, pb < pc ? pc : pb, "spouse")).ok);
    check("không liên kết người của gia đình khác", !(await t("insert into public.family_relationships (family_id, person_a, person_b, kind, created_by) values ($1,$2,$3,'parent',auth.uid())", [famB, pa, pb])).ok);
    const p3 = await mk("Cha thứ ba");
    await rel(p3, pc); // cha/mẹ thứ 2 của Con (đã có Bố) — hợp lệ
    const p4 = await mk("Cha thứ tư");
    check("tối đa 2 cha/mẹ", !(await rel(p4, pc)).ok);
  });

  // --- ngày sinh riêng tư ---
  let pBirth;
  await as("binh", async ({ q, t }) => {
    pBirth = (await q("insert into public.people (family_id, full_name, birth_date, birth_date_visible, created_by) values ($1,'Người có ngày sinh riêng','1990-01-02',false,auth.uid()) returning id", [famA])).rows[0].id;
    const own = (await t("select birth_date from public.people_directory($1) where id=$2", [famA, pBirth])).rows[0];
    check("người tạo hồ sơ thấy ngày sinh của hồ sơ mình tạo", !!own?.birth_date);
  });
  await admin.query("update public.family_memberships set role='viewer' where family_id=$1 and user_id=$2", [famA, U.binh]).catch(() => {});
  await admin.query("insert into public.family_memberships (family_id,user_id,role) values ($1,$2,'contributor') on conflict do nothing", [famA, U.dung]);
  await as("dung", async ({ t }) => {
    const r = (await t("select birth_date from public.people_directory($1) where id=$2", [famA, pBirth])).rows[0];
    check("thành viên khác KHÔNG thấy ngày sinh khi chưa được chia sẻ (che ngay ở cơ sở dữ liệu)", r && r.birth_date === null, JSON.stringify(r));
    const direct = await t("select birth_date from public.people where id=$1", [pBirth]);
    check("không đọc trực tiếp cột birth_date của bảng people", !direct.ok);
    check("vẫn đọc được các cột khác của bảng people", (await t("select full_name from public.people where id=$1", [pBirth])).rows.length === 1);
  });
  await as("chi", async ({ t }) => { check("người ngoài gia đình không xem được danh bạ", (await t("select * from public.people_directory($1)", [famA])).rows.length === 0); });

  // --- thư gửi tương lai ---
  let letterFuture, letterPast;
  await as("binh", async ({ q }) => {
    letterFuture = (await q("insert into public.letters (family_id, author_id, recipient_person_id, title, body, open_on, status) values ($1, auth.uid(), null, 'Mở năm sau', 'bí mật', current_date + 365, 'sealed') returning id", [famA])).rows[0].id;
    letterPast = (await q("insert into public.letters (family_id, author_id, recipient_person_id, title, body, open_on, status) values ($1, auth.uid(), null, 'Đã đến hạn', 'mở được', current_date - 1, 'sealed') returning id", [famA])).rows[0].id;
    await q("insert into public.letters (family_id, author_id, recipient_person_id, title, body, open_on, status) values ($1, auth.uid(), null, 'Nháp', 'chưa gửi', current_date - 1, 'draft')", [famA]);
  });
  await as("an", async ({ t }) => {
    const l = (await t("select title, body from public.letters")).rows;
    check("người nhận KHÔNG đọc được thư chưa đến ngày mở", !l.some((r) => r.title === "Mở năm sau"));
    check("người nhận đọc được thư đã đến ngày", l.some((r) => r.title === "Đã đến hạn"));
    check("người nhận KHÔNG đọc được bản nháp", !l.some((r) => r.title === "Nháp"));
  });
  await as("binh", async ({ t }) => { check("tác giả luôn đọc được thư của mình", (await t("select * from public.letters")).rows.length === 3); });
  await as("chi", async ({ t }) => { check("người ngoài gia đình không đọc được thư", (await t("select * from public.letters")).rows.length === 0); });

  // --- xoá tài khoản (yêu cầu) & dữ liệu khi xoá người dùng ---
  await as("dung", async ({ t }) => {
    check("gửi yêu cầu xoá tài khoản", (await t("select public.request_account_deletion('không dùng nữa')")).ok);
    check("huỷ yêu cầu xoá tài khoản", (await t("select public.cancel_account_deletion()")).ok);
  });
  // chủ sở hữu bị xoá tài khoản: ký ức giữ lại, created_by -> null (không lỗi trigger)
  const del = await admin.query("delete from auth.users where id=$1", [U.an]).then(() => true, (e) => e.message);
  check("xoá tài khoản người dùng không gây lỗi ràng buộc", del === true, String(del));
  check("ký ức của người đã xoá vẫn còn trong gia đình", (await admin.query("select count(*)::int c from public.memories where family_id=$1 and created_by is null", [famA])).rows[0].c >= 1);

  await admin.end();
}

try {
  await main();
} catch (e) {
  fail++;
  results.push("✘ LỖI CHẠY KIỂM THỬ: " + (e?.stack || e));
} finally {
  await server.stop().catch(() => {});
  fs.rmSync(parent, { recursive: true, force: true });
}
console.log(results.join("\n"));
console.log(`\nKết quả: ${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);

import type { Metadata } from "next";
import Link from "next/link";
import { requireFamily } from "@/lib/session";
import { listPeople } from "@/lib/data/people";
import { Avatar, EmptyState, LinkBtn, Notice, PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Thành viên" };

export default async function MembersPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const sp = await searchParams;
  const ctx = await requireFamily();
  const people = await listPeople(ctx);
  return (
    <>
      <PageTitle eyebrow="Gia đình" title="Những người thân yêu">{ctx.canWrite && <LinkBtn href="/family/members/new">Thêm hồ sơ</LinkBtn>}</PageTitle>
      {sp.deleted && <div className="mb-6"><Notice kind="success">Đã xoá hồ sơ.</Notice></div>}
      {people.length === 0 ? (
        <EmptyState title="Chưa có hồ sơ nào" action={ctx.canWrite ? <LinkBtn href="/family/members/new">Thêm hồ sơ đầu tiên</LinkBtn> : undefined}>Hồ sơ giúp gắn ký ức với từng người thân, kể cả người chưa dùng website.</EmptyState>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => (
            <li key={p.id}>
              <Link href={`/family/members/${p.id}`} className="card flex items-center gap-4 p-5 text-ink no-underline transition hover:border-stone">
                <Avatar name={p.full_name} url={p.avatar_url} size={64} />
                <span className="min-w-0"><span className="block truncate font-serif text-[1.3rem]">{p.full_name}</span>
                  <span className="block truncate text-[15px] text-stone">{p.relation_label || "Thành viên"}{p.user_id ? " · có tài khoản" : ""}{p.is_demo ? " · mẫu" : ""}</span></span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

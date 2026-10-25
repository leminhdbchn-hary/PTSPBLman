import type { Metadata } from "next";
import Link from "next/link";
import { requireFamily } from "@/lib/session";
import { listPeople, listRelationships } from "@/lib/data/people";
import { layoutTree } from "@/lib/tree";
import { RelationshipForm } from "@/components/RelationshipForm";
import { ConfirmForm } from "@/components/ConfirmForm";
import { Avatar, EmptyState, LinkBtn, PageTitle } from "@/components/ui";
import { deleteRelationship } from "@/app/actions/people";

export const metadata: Metadata = { title: "Gia phả" };

export default async function TreePage() {
  const ctx = await requireFamily();
  const [people, rels] = await Promise.all([listPeople(ctx), listRelationships(ctx)]);
  const { generations, orphans } = layoutTree(people, rels);
  const byId = new Map(people.map((p) => [p.id, p]));
  const parentsOf = (id: string) => rels.filter((r) => r.kind === "parent" && r.person_b === id).map((r) => byId.get(r.person_a)?.full_name).filter(Boolean) as string[];
  const label = (r: (typeof rels)[number]) => `${byId.get(r.person_a)?.full_name ?? "?"} ${r.kind === "parent" ? "là cha/mẹ của" : "là vợ/chồng của"} ${byId.get(r.person_b)?.full_name ?? "?"}`;
  const genName = (i: number) => (i === 0 ? "Thế hệ đầu tiên" : `Thế hệ thứ ${i + 1}`);

  return (
    <>
      <PageTitle eyebrow="Gia phả" title="Các thế hệ trong gia đình">{ctx.canWrite && <LinkBtn href="/family/members/new" soft>Thêm người</LinkBtn>}</PageTitle>
      {people.length < 2 ? (
        <EmptyState title="Cần ít nhất hai hồ sơ" action={ctx.canWrite ? <LinkBtn href="/family/members/new">Thêm hồ sơ</LinkBtn> : undefined}>Hãy thêm hồ sơ các thành viên rồi nối quan hệ cha mẹ, con cái và vợ chồng.</EmptyState>
      ) : (
        <div className="space-y-12">
          {generations.length === 0 ? (
            <EmptyState title="Chưa có quan hệ nào">Dùng form bên dưới để nối quan hệ giữa các thành viên, sơ đồ sẽ hiện ở đây.</EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-warm p-5 sm:p-8" tabIndex={0} role="region" aria-label="Sơ đồ gia phả, cuộn ngang nếu cần">
              <div className="min-w-max space-y-9">
                {generations.map((g, i) => (
                  <div key={g.level}>
                    <p className="eyebrow mb-3">{genName(i)}</p>
                    <ul className="flex flex-wrap items-stretch gap-x-3 gap-y-4">
                      {g.people.map((n, k) => {
                        const prev = g.people[k - 1];
                        const married = prev && (n.spouses.includes(prev.person.id));
                        const ps = parentsOf(n.person.id);
                        return (
                          <li key={n.person.id} className="flex items-center gap-3">
                            {married && <span aria-label="vợ chồng" title="vợ chồng" className="font-serif text-[1.4rem] text-moss">⚭</span>}
                            <Link href={`/family/members/${n.person.id}`} className="card flex w-[210px] items-center gap-3 p-3.5 text-ink no-underline transition hover:border-stone">
                              <Avatar name={n.person.full_name} url={n.person.avatar_url} size={48} />
                              <span className="min-w-0"><span className="block truncate font-medium">{n.person.full_name}</span>
                                <span className="block truncate text-[13.5px] text-stone">{ps.length ? `con của ${ps.join(" & ")}` : n.person.relation_label || ""}</span></span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
          {orphans.length > 0 && (
            <section aria-labelledby="chua-noi"><h2 id="chua-noi" className="mb-3 text-[1.3rem]">Chưa nối quan hệ</h2>
              <p className="flex flex-wrap gap-2">{orphans.map((p) => <Link key={p.id} href={`/family/members/${p.id}`} className="rounded-full border border-line bg-warm px-3.5 py-1 text-[15px] text-ink no-underline">{p.full_name}</Link>)}</p></section>
          )}
          {ctx.canWrite && <RelationshipForm people={people.map((p) => ({ id: p.id, full_name: p.full_name }))} />}
          {rels.length > 0 && (
            <section aria-labelledby="ds-qh">
              <h2 id="ds-qh" className="mb-4 text-[1.3rem]">Các quan hệ đã nối</h2>
              <ul className="divide-y divide-line rounded-2xl border border-line bg-warm">
                {rels.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3"><span>{label(r)}</span>
                    {ctx.canWrite && <ConfirmForm action={deleteRelationship} message={`Gỡ quan hệ: ${label(r)}?`} label="Gỡ" className="btn-soft btn-sm"><input type="hidden" name="id" value={r.id} /></ConfirmForm>}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}

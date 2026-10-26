import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Avatar, ConfirmButton, EmptyState, LinkBtn, Loading, Notice, PageTitle, Submit, ErrorState } from "@/components/ui";
import { useAsync, useFamily } from "@/lib/session";
import { addRelationship, deleteRelationship, friendlyError, listPeople, listRelationships } from "@/lib/data";
import { layoutTree } from "@/lib/tree";

export default function TreePage() {
  const ctx = useFamily();
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useAsync(async () => {
    const [people, rels] = await Promise.all([listPeople(ctx), listRelationships(ctx)]);
    return { people, rels };
  }, [ctx.fid]);
  if (loading && !data) return <Loading />;
  if (error || !data) return <ErrorState message={friendlyError(error)} onRetry={reload} />;
  const { people, rels } = data;
  const { generations, orphans } = layoutTree(people, rels);
  const byId = new Map(people.map((p) => [p.id, p]));
  const parentsOf = (id: string) => rels.filter((r) => r.kind === "parent" && r.b === id).map((r) => byId.get(r.a)?.fullName).filter(Boolean) as string[];
  const label = (r: (typeof rels)[number]) => `${byId.get(r.a)?.fullName ?? "?"} ${r.kind === "parent" ? "là cha/mẹ của" : "là vợ/chồng của"} ${byId.get(r.b)?.fullName ?? "?"}`;
  const genName = (i: number) => (i === 0 ? "Thế hệ đầu tiên" : `Thế hệ thứ ${i + 1}`);

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const a = String(f.get("personA") ?? ""), b = String(f.get("personB") ?? ""), kind = f.get("kind") === "spouse" ? "spouse" : "parent";
    if (!a || !b) { setMsg({ kind: "error", text: "Bạn chọn đủ hai người nhé." }); return; }
    setBusy(true); setMsg(null);
    try {
      await addRelationship(ctx, a, b, kind);
      setMsg({ kind: "success", text: "Đã thêm quan hệ." });
      form.reset();
      reload();
    } catch (x) {
      setMsg({ kind: "error", text: friendlyError(x, "Chưa thêm được quan hệ.") });
    }
    setBusy(false);
  }

  return (
    <>
      <PageTitle eyebrow="Gia phả" title="Các thế hệ trong gia đình">{ctx.canWrite && <LinkBtn to="/family/members/new" soft>Thêm người</LinkBtn>}</PageTitle>
      {people.length < 2 ? (
        <EmptyState title="Cần ít nhất hai hồ sơ" action={ctx.canWrite ? <LinkBtn to="/family/members/new">Thêm hồ sơ</LinkBtn> : undefined}>Hãy thêm hồ sơ các thành viên rồi nối quan hệ cha mẹ, con cái, vợ chồng.</EmptyState>
      ) : (
        <div className="space-y-12">
          {generations.length === 0 ? (
            <EmptyState title="Chưa có quan hệ nào">Dùng form bên dưới để nối quan hệ giữa các thành viên, sơ đồ sẽ hiện ở đây.</EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-warm p-5 sm:p-8" tabIndex={0} role="region" aria-label="Sơ đồ gia phả, cuộn ngang nếu cần">
              <div className="space-y-9 sm:min-w-max">
                {generations.map((g, i) => (
                  <div key={g.level}>
                    <p className="eyebrow mb-3">{genName(i)}</p>
                    <ul className="grid gap-3 sm:flex sm:flex-wrap sm:items-stretch sm:gap-x-3 sm:gap-y-4">
                      {g.people.map((n, k) => {
                        const prev = g.people[k - 1];
                        const married = prev && n.spouses.includes(prev.person.id);
                        const ps = parentsOf(n.person.id);
                        return (
                          <li key={n.person.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                            {married && <span title="vợ chồng" className="pl-1 font-serif text-[15px] text-moss sm:text-[1.4rem]"><span aria-hidden>⚭</span><span className="sm:sr-only"> vợ/chồng của người ở trên</span></span>}
                            <Link to={`/family/members/${n.person.id}`} className="card flex w-full items-center gap-3 p-3.5 text-ink no-underline transition hover:border-stone sm:w-[210px]">
                              <Avatar name={n.person.fullName} url={n.person.avatar} size={48} />
                              <span className="min-w-0"><span className="block truncate font-medium">{n.person.fullName}</span>
                                <span className="block truncate text-[13.5px] text-stone">{ps.length ? `con của ${ps.join(" & ")}` : n.person.relationLabel || ""}</span></span>
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
              <p className="flex flex-wrap gap-2">{orphans.map((p) => <Link key={p.id} to={`/family/members/${p.id}`} className="inline-flex min-h-[40px] items-center rounded-full border border-line bg-warm px-3.5 text-[15px] text-ink no-underline">{p.fullName}</Link>)}</p>
            </section>
          )}
          {ctx.canWrite && (
            <form onSubmit={add} className="card space-y-4 p-5 sm:p-6">
              <h3 className="text-[1.3rem]">Thêm một quan hệ</h3>
              {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                <div><label htmlFor="personA" className="label">Người thứ nhất</label>
                  <select id="personA" name="personA" className="input" required defaultValue=""><option value="" disabled>Chọn người…</option>{people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select></div>
                <div><label htmlFor="kind" className="label">là</label>
                  <select id="kind" name="kind" className="input" defaultValue="parent"><option value="parent">cha/mẹ của</option><option value="spouse">vợ/chồng của</option></select></div>
                <div><label htmlFor="personB" className="label">Người thứ hai</label>
                  <select id="personB" name="personB" className="input" required defaultValue=""><option value="" disabled>Chọn người…</option>{people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}</select></div>
              </div>
              <Submit busy={busy} className="btn btn-sm" busyText="Đang lưu…">Thêm quan hệ</Submit>
            </form>
          )}
          {rels.length > 0 && (
            <section aria-labelledby="ds-qh">
              <h2 id="ds-qh" className="mb-4 text-[1.3rem]">Các quan hệ đã nối</h2>
              <ul className="divide-y divide-line rounded-2xl border border-line bg-warm">
                {rels.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"><span>{label(r)}</span>
                    {(ctx.isAdmin || (ctx.canWrite && r.createdBy === ctx.user.uid)) && (
                      <ConfirmButton label="Gỡ" className="btn-soft btn-sm" question={`Gỡ: ${label(r)}?`} confirmLabel="Gỡ"
                        onConfirm={async () => { try { await deleteRelationship(ctx, r.id); reload(); } catch (x) { setMsg({ kind: "error", text: friendlyError(x) }); } }} />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </>
  );
}

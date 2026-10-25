import type { Person, Relationship } from "./types";

export type TreeNode<P extends Person = Person> = { person: P; generation: number; spouses: string[] };
export type TreeLayout<P extends Person = Person> = { generations: { level: number; people: TreeNode<P>[] }[]; orphans: P[] };

/** Kiểm tra thêm cạnh cha/mẹ → con có tạo vòng lặp không (giống trigger ở cơ sở dữ liệu, dùng để báo lỗi sớm ở giao diện). */
export function wouldCreateCycle(rels: Pick<Relationship, "person_a" | "person_b" | "kind">[], parent: string, child: string): boolean {
  if (parent === child) return true;
  // child không được là tổ tiên của parent
  const parentsOf = new Map<string, string[]>();
  for (const r of rels) if (r.kind === "parent") parentsOf.set(r.person_b, [...(parentsOf.get(r.person_b) ?? []), r.person_a]);
  const seen = new Set<string>();
  const stack = [parent];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === child) return true;
    if (seen.has(cur)) continue;
    seen.add(cur);
    stack.push(...(parentsOf.get(cur) ?? []));
  }
  return false;
}

/** Xếp mọi người vào các thế hệ: thế hệ = độ sâu dài nhất từ tổ tiên; vợ/chồng được kéo về cùng thế hệ. */
export function layoutTree<P extends Person>(people: P[], rels: Relationship[]): TreeLayout<P> {
  const byId = new Map(people.map((p) => [p.id, p]));
  const parents = new Map<string, string[]>();
  const spouses = new Map<string, string[]>();
  for (const r of rels) {
    if (!byId.has(r.person_a) || !byId.has(r.person_b)) continue;
    if (r.kind === "parent") parents.set(r.person_b, [...(parents.get(r.person_b) ?? []), r.person_a]);
    else {
      spouses.set(r.person_a, [...(spouses.get(r.person_a) ?? []), r.person_b]);
      spouses.set(r.person_b, [...(spouses.get(r.person_b) ?? []), r.person_a]);
    }
  }
  const memo = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return 0; // dữ liệu hỏng (không xảy ra vì có trigger), tránh lặp vô hạn
    visiting.add(id);
    const ps = parents.get(id) ?? [];
    const d = ps.length ? 1 + Math.max(...ps.map(depth)) : 0;
    visiting.delete(id);
    memo.set(id, d);
    return d;
  };
  const gen = new Map<string, number>();
  for (const p of people) gen.set(p.id, depth(p.id));
  // vợ/chồng cùng thế hệ (lấy thế hệ sâu hơn), lặp vài lần cho ổn định
  for (let i = 0; i < 4; i++) {
    for (const [a, list] of spouses) for (const b of list) {
      const g = Math.max(gen.get(a) ?? 0, gen.get(b) ?? 0);
      gen.set(a, g);
      gen.set(b, g);
    }
  }
  const connected = new Set<string>();
  for (const r of rels) { connected.add(r.person_a); connected.add(r.person_b); }
  const orphans = people.filter((p) => !connected.has(p.id));
  const levels = new Map<number, TreeNode<P>[]>();
  for (const p of people) {
    if (!connected.has(p.id)) continue;
    const g = gen.get(p.id) ?? 0;
    levels.set(g, [...(levels.get(g) ?? []), { person: p, generation: g, spouses: spouses.get(p.id) ?? [] }]);
  }
  const generations = [...levels.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, list]) => {
      // vợ/chồng đứng cạnh nhau
      const placed = new Set<string>();
      const ordered: TreeNode<P>[] = [];
      for (const n of list.sort((x, y) => x.person.full_name.localeCompare(y.person.full_name, "vi"))) {
        if (placed.has(n.person.id)) continue;
        placed.add(n.person.id);
        ordered.push(n);
        for (const sid of n.spouses) {
          const sn = list.find((x) => x.person.id === sid);
          if (sn && !placed.has(sid)) { placed.add(sid); ordered.push(sn); }
        }
      }
      return { level, people: ordered };
    });
  return { generations, orphans };
}

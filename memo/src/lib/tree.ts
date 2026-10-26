import type { Person, Relationship } from "./types";

type P = Pick<Person, "id" | "fullName">;
export type TreeNode<T extends P = Person> = { person: T; generation: number; spouses: string[] };
export type TreeLayout<T extends P = Person> = { generations: { level: number; people: TreeNode<T>[] }[]; orphans: T[] };
type Rel = Pick<Relationship, "a" | "b" | "kind">;

/** Thêm cạnh cha/mẹ → con có tạo vòng lặp không (người con đã là tổ tiên của người cha/mẹ). */
export function wouldCreateCycle(rels: Rel[], parent: string, child: string): boolean {
  if (parent === child) return true;
  const parentsOf = new Map<string, string[]>();
  for (const r of rels) if (r.kind === "parent") parentsOf.set(r.b, [...(parentsOf.get(r.b) ?? []), r.a]);
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

/** Kiểm tra một quan hệ mới trước khi lưu; trả về thông báo lỗi tiếng Việt hoặc null. */
export function relationshipProblem(rels: Rel[], a: string, b: string, kind: "parent" | "spouse"): string | null {
  if (a === b) return "Hãy chọn hai người khác nhau.";
  if (kind === "parent") {
    if (rels.some((r) => r.kind === "parent" && r.a === a && r.b === b)) return "Quan hệ này đã có rồi.";
    if (rels.filter((r) => r.kind === "parent" && r.b === b).length >= 2) return "Mỗi người chỉ có tối đa hai cha/mẹ trong gia phả.";
    if (wouldCreateCycle(rels, a, b)) return "Quan hệ này tạo vòng lặp trong gia phả (người này đã là tổ tiên của người kia).";
  } else {
    const [x, y] = [a, b].sort();
    if (rels.some((r) => r.kind === "spouse" && r.a === x && r.b === y)) return "Quan hệ này đã có rồi.";
    if (wouldCreateCycle(rels, a, b) || wouldCreateCycle(rels, b, a)) return "Hai người này đã là cha/mẹ – con của nhau.";
  }
  return null;
}

/** Xếp mọi người vào các thế hệ: thế hệ = độ sâu dài nhất từ tổ tiên; vợ/chồng được kéo về cùng thế hệ. */
export function layoutTree<T extends P>(people: T[], rels: Rel[]): TreeLayout<T> {
  const byId = new Map(people.map((p) => [p.id, p]));
  const parents = new Map<string, string[]>();
  const spouses = new Map<string, string[]>();
  for (const r of rels) {
    if (!byId.has(r.a) || !byId.has(r.b)) continue;
    if (r.kind === "parent") parents.set(r.b, [...(parents.get(r.b) ?? []), r.a]);
    else {
      spouses.set(r.a, [...(spouses.get(r.a) ?? []), r.b]);
      spouses.set(r.b, [...(spouses.get(r.b) ?? []), r.a]);
    }
  }
  const memo = new Map<string, number>();
  const visiting = new Set<string>();
  const depth = (id: string): number => {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return 0; // dữ liệu hỏng: tránh lặp vô hạn
    visiting.add(id);
    const ps = parents.get(id) ?? [];
    const d = ps.length ? 1 + Math.max(...ps.map(depth)) : 0;
    visiting.delete(id);
    memo.set(id, d);
    return d;
  };
  const gen = new Map<string, number>();
  for (const p of people) gen.set(p.id, depth(p.id));
  for (let i = 0; i < 4; i++) {
    for (const [a, list] of spouses) for (const b of list) {
      const g = Math.max(gen.get(a) ?? 0, gen.get(b) ?? 0);
      gen.set(a, g);
      gen.set(b, g);
    }
  }
  const connected = new Set<string>();
  for (const r of rels) if (byId.has(r.a) && byId.has(r.b)) { connected.add(r.a); connected.add(r.b); }
  const orphans = people.filter((p) => !connected.has(p.id));
  const levels = new Map<number, TreeNode<T>[]>();
  for (const p of people) {
    if (!connected.has(p.id)) continue;
    const g = gen.get(p.id) ?? 0;
    levels.set(g, [...(levels.get(g) ?? []), { person: p, generation: g, spouses: spouses.get(p.id) ?? [] }]);
  }
  const generations = [...levels.entries()]
    .sort((x, y) => x[0] - y[0])
    .map(([level, list]) => {
      const placed = new Set<string>();
      const ordered: TreeNode<T>[] = [];
      for (const n of list.sort((x, y) => x.person.fullName.localeCompare(y.person.fullName, "vi"))) {
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

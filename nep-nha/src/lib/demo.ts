import "server-only";
import type { Ctx } from "@/lib/session";

/** Dữ liệu mẫu hoàn toàn giả lập (tên, ngày, câu chuyện đều hư cấu). Mọi dòng mang cờ is_demo để xoá sạch bằng một nút. */
const PEOPLE = [
  { key: "ong", full_name: "Ông Hải", relation_label: "Ông nội", bio: "Nhân vật giả lập. Ông thích chuyện xưa và ly trà nóng buổi sáng." },
  { key: "ba", full_name: "Bà Lan", relation_label: "Bà nội", bio: "Nhân vật giả lập. Bà nấu món canh chua mà cả nhà nhớ mãi." },
  { key: "bo", full_name: "Bố Minh", relation_label: "Bố", bio: "Nhân vật giả lập." },
  { key: "me", full_name: "Mẹ Thu", relation_label: "Mẹ", bio: "Nhân vật giả lập." },
  { key: "con", full_name: "Bé An", relation_label: "Con", bio: "Nhân vật giả lập." },
] as const;

const MEMORIES = [
  {
    title: "Bữa cơm chiều ngày mưa",
    date: "2023-09-14",
    tags: ["Bữa cơm gia đình", "Ngày bình thường đáng nhớ"],
    people: ["bo", "me", "con"],
    img: "rainy-dinner.svg",
    body: "Chiều đó mưa từ lúc tan học. Cả nhà ngồi quanh mâm cơm, mẹ nấu canh chua và cá kho. Bé An vừa ăn vừa kể chuyện ở lớp, bố cười đến sặc nước. Không có gì đặc biệt cả, vậy mà bây giờ nhớ lại vẫn thấy ấm.",
  },
  {
    title: "Ngày đầu tiên con đến trường",
    date: "2024-09-05",
    tags: ["Tuổi thơ"],
    people: ["con", "me", "bo"],
    img: "first-day-school.svg",
    body: "Con đeo chiếc cặp còn thơm mùi mới, nắm chặt tay mẹ ở cổng trường. Đến lúc cô gọi tên, con quay lại vẫy tay thật nhanh rồi chạy vào lớp. Mẹ đứng lại thêm một lúc, bố nói “con lớn rồi” mà mắt cũng đỏ.",
  },
  {
    title: "Chuyến về quê mùa hè năm ấy",
    date: "2023-07-22",
    tags: ["Chuyến đi"],
    people: ["ong", "ba", "con"],
    img: "village-summer.svg",
    body: "Cả nhà về quê ba ngày. Sáng nào bà cũng dậy sớm đun nước, ông dắt bé An ra vườn hái ổi. Chiều xuống, gió từ cánh đồng thổi mát, cả nhà ngồi ngoài hiên nghe tiếng ve.",
  },
  {
    title: "Câu chuyện ông kể về tuổi trẻ",
    date: "2022-12-03",
    tags: ["Những người thân yêu"],
    people: ["ong", "con"],
    img: "grandpa-story.svg",
    body: "Tối đó mất điện, ông thắp ngọn đèn nhỏ rồi kể chuyện ngày ông còn đi học xa nhà, mỗi tháng mới được về một lần. Bé An ngồi nghe, không hỏi gì, đến khi ông ngừng mới thì thầm: “Ông kể tiếp đi.”",
  },
  {
    title: "Tết đầu tiên cả nhà sum họp",
    date: "2024-02-10",
    tags: ["Bữa cơm gia đình", "Tết"],
    people: ["ong", "ba", "bo", "me", "con"],
    img: "tet-reunion.svg",
    body: "Năm nay đủ cả ba thế hệ cùng đón Tết ở một nhà. Bà gói bánh chưng, ông cắm cành đào, bé An nhận bao lì xì đầu tiên và giữ chặt suốt buổi chiều. Mẹ chụp tấm ảnh cả nhà, ai cũng cười không nhìn máy.",
  },
];

export async function seedDemoData(ctx: Ctx): Promise<{ ok: boolean; error?: string }> {
  const { supabase, family, user } = ctx;
  const { count } = await supabase.from("memories").select("id", { count: "exact", head: true }).eq("family_id", family.id).eq("is_demo", true);
  if ((count ?? 0) > 0) return { ok: false, error: "Dữ liệu mẫu đã có sẵn trong sổ." };

  const { data: pRows, error: pErr } = await supabase
    .from("people")
    .insert(PEOPLE.map((p) => ({ family_id: family.id, full_name: p.full_name, relation_label: p.relation_label, bio: p.bio, is_demo: true, created_by: user.id })))
    .select("id, full_name");
  if (pErr || !pRows) return { ok: false, error: "Chưa thêm được hồ sơ mẫu." };
  const id = new Map<string, string>(PEOPLE.map((p) => [p.key, (pRows as { id: string; full_name: string }[]).find((r) => r.full_name === p.full_name)?.id ?? ""]));

  const parent = (a: string, b: string) => ({ family_id: family.id, person_a: id.get(a)!, person_b: id.get(b)!, kind: "parent", created_by: user.id });
  const spouse = (a: string, b: string) => {
    const [x, y] = [id.get(a)!, id.get(b)!].sort();
    return { family_id: family.id, person_a: x, person_b: y, kind: "spouse", created_by: user.id };
  };
  await supabase.from("family_relationships").insert([parent("ong", "bo"), parent("ba", "bo"), parent("bo", "con"), parent("me", "con"), spouse("ong", "ba"), spouse("bo", "me")]);

  for (const m of MEMORIES) {
    const { data: row, error } = await supabase
      .from("memories")
      .insert({ family_id: family.id, title: m.title, body: m.body, happened_on: m.date, tags: m.tags, visibility: "family", is_demo: true, created_by: user.id })
      .select("id")
      .single();
    if (error || !row) return { ok: false, error: "Chưa thêm được ký ức mẫu." };
    const mid = (row as { id: string }).id;
    await supabase.from("memory_media").insert({
      memory_id: mid, family_id: family.id, storage_path: `demo:/demo/${m.img}#${mid}`, mime_type: "image/svg+xml", size_bytes: 1, width: 1200, height: 800, caption: "Hình minh hoạ", created_by: user.id,
    });
    await supabase.from("memory_people").insert(m.people.map((k) => ({ memory_id: mid, person_id: id.get(k)!, family_id: family.id })));
  }
  return { ok: true };
}

export async function clearDemoData(ctx: Ctx): Promise<void> {
  // ký ức mẫu → ảnh/liên kết tự xoá theo; hồ sơ mẫu → quan hệ tự xoá theo
  await ctx.supabase.from("memories").delete().eq("family_id", ctx.family.id).eq("is_demo", true);
  await ctx.supabase.from("people").delete().eq("family_id", ctx.family.id).eq("is_demo", true);
}

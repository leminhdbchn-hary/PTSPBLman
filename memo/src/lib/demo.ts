// Dữ liệu mẫu hoàn toàn giả lập (tên, ngày, câu chuyện đều hư cấu). Mọi tài liệu mang cờ isDemo để xoá sạch bằng một nút.
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { addRelationship, deleteMemory, deletePerson, UserError, type Ctx } from "./data";
import type { Memory, Person } from "./types";

const PEOPLE = [
  { key: "ong", fullName: "Ông Hải", relationLabel: "Ông nội", bio: "Nhân vật giả lập. Ông thích chuyện xưa và ly trà nóng buổi sáng." },
  { key: "ba", fullName: "Bà Lan", relationLabel: "Bà nội", bio: "Nhân vật giả lập. Bà nấu món canh chua mà cả nhà nhớ mãi." },
  { key: "bo", fullName: "Bố Minh", relationLabel: "Bố", bio: "Nhân vật giả lập." },
  { key: "me", fullName: "Mẹ Thu", relationLabel: "Mẹ", bio: "Nhân vật giả lập." },
  { key: "con", fullName: "Bé An", relationLabel: "Con", bio: "Nhân vật giả lập." },
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


const F = "nn_families";

export async function seedDemoData(ctx: Ctx): Promise<void> {
  const { db, fid, user } = ctx;
  const existing = await getDocs(query(collection(db, F, fid, "memories"), where("isDemo", "==", true), where("visibility", "==", "family")));
  if (!existing.empty) throw new UserError("Dữ liệu mẫu đã có sẵn trong sổ.");
  const id = new Map<string, string>();
  for (const p of PEOPLE) {
    const ref = doc(collection(db, F, fid, "people"));
    await setDoc(ref, { fullName: p.fullName, relationLabel: p.relationLabel, bio: p.bio, birthDate: null, birthDateVisible: false, avatar: null, userId: null, isDemo: true, createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    id.set(p.key, ref.id);
  }
  const rels: [string, string, "parent" | "spouse"][] = [["ong", "bo", "parent"], ["ba", "bo", "parent"], ["bo", "con", "parent"], ["me", "con", "parent"], ["ong", "ba", "spouse"], ["bo", "me", "spouse"]];
  for (const [a, b, k] of rels) await addRelationship(ctx, id.get(a)!, id.get(b)!, k, true);
  for (const m of MEMORIES) {
    const ref = doc(collection(db, F, fid, "memories"));
    const batch = writeBatch(db);
    batch.set(ref, {
      title: m.title, body: m.body, happenedOn: m.date, location: null, tags: m.tags, visibility: "family", personIds: m.people.map((k) => id.get(k)!),
      photoIds: [], cover: null, demoImages: [`/demo/${m.img}`], createdBy: user.uid, createdByName: user.name, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), isDemo: true,
    });
    batch.set(doc(collection(db, F, fid, "registry")), { kind: "memory", path: ref.path, createdBy: user.uid });
    await batch.commit();
  }
}

export async function clearDemoData(ctx: Ctx): Promise<void> {
  const { db, fid } = ctx;
  const ms = await getDocs(query(collection(db, F, fid, "memories"), where("isDemo", "==", true), where("visibility", "==", "family")));
  for (const d of ms.docs) await deleteMemory(ctx, { id: d.id, ...d.data() } as Memory);
  const ps = await getDocs(query(collection(db, F, fid, "people"), where("isDemo", "==", true)));
  for (const d of ps.docs) await deletePerson(ctx, { id: d.id, ...d.data() } as Person);
}

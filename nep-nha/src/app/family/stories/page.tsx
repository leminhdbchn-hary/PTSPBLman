import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { requireFamily } from "@/lib/session";

export const metadata: Metadata = { title: "Lời kể của người thân" };

const PROMPTS = [
  "Ông bà gặp nhau như thế nào?",
  "Tuổi thơ của cha mẹ ra sao?",
  "Kỷ niệm nào khiến gia đình tự hào nhất?",
  "Điều gì ông bà muốn truyền lại cho con cháu?",
  "Bài học quan trọng nhất trong cuộc đời là gì?",
];

export default async function StoriesPage() {
  await requireFamily();
  return (
    <div className="max-w-read">
      <PageTitle eyebrow="Sắp ra mắt" title="Lời kể của người thân" />
      <p className="text-[1.1rem] text-stone">Phần ghi âm và lưu lời kể của ông bà, cha mẹ chưa được triển khai trong phiên bản này (cơ sở dữ liệu đã có sẵn bảng <code>stories</code>). Trong lúc chờ, bạn có thể ghi lại lời kể thành một ký ức có chữ và ảnh.</p>
      <h2 className="mb-4 mt-10 text-[1.5rem]">Những câu hỏi gợi ý để hỏi người thân</h2>
      <ul className="space-y-3">{PROMPTS.map((p) => <li key={p} className="card px-5 py-4 font-serif text-[1.15rem]">{p}</li>)}</ul>
    </div>
  );
}

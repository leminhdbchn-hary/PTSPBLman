import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { requireFamily } from "@/lib/session";

export const metadata: Metadata = { title: "Thư gửi tương lai" };

export default async function LettersPage() {
  await requireFamily();
  return (
    <div className="max-w-read">
      <PageTitle eyebrow="Sắp ra mắt" title="Thư gửi tương lai" />
      <p className="text-[1.1rem] text-stone">Tính năng viết thư và hẹn ngày mở chưa có giao diện trong phiên bản này. Phần quan trọng nhất đã sẵn sàng ở cơ sở dữ liệu: thư chưa đến ngày mở sẽ <strong>không trả về bất kỳ dòng dữ liệu nào</strong> cho người nhận, nên không ai đọc lén được qua giao diện hay API.</p>
      <p className="mt-6 text-[1rem] text-stone">Lưu ý khi dùng sau này: chúng tôi không cam kết thư sẽ được chuyển giao tự động sau nhiều thập kỷ. Người dùng vẫn nên duy trì tài khoản và sao lưu dữ liệu định kỳ.</p>
    </div>
  );
}

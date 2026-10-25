import Link from "next/link";

export default function NotFound() {
  return (
    <main id="noi-dung" className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="text-[2.2rem]">Không tìm thấy trang này</h1>
      <p className="mb-7 mt-3 max-w-md text-stone">Trang không tồn tại, đã bị xoá hoặc bạn không có quyền xem.</p>
      <Link href="/" className="btn">Về trang chủ</Link>
    </main>
  );
}

"use client";
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="noi-dung" className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-[2rem]">Có điều gì đó chưa ổn</h1>
      <p className="mb-7 mt-3 max-w-md text-stone">Trang chưa tải được. Có thể do mạng chập chờn hoặc phiên đăng nhập đã hết hạn. Bạn thử lại nhé.</p>
      <div className="flex gap-3"><button className="btn" onClick={reset}>Thử lại</button><a href="/login" className="btn-soft">Đăng nhập lại</a></div>
    </main>
  );
}

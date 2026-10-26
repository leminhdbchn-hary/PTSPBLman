import Link from "next/link";
import { Logo } from "./ui";
import { contactEmail, isConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  let signedIn = false;
  if (isConfigured()) {
    try {
      const { data } = await (await createClient()).auth.getUser();
      signedIn = !!data.user;
    } catch { /* trang giới thiệu vẫn hiển thị khi không đọc được phiên */ }
  }
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Menu chính" className="hidden items-center gap-8 text-[16px] md:flex">
          <Link href="/#cau-chuyen" className="text-ink no-underline hover:underline">Câu chuyện</Link>
          <Link href="/#tinh-nang" className="text-ink no-underline hover:underline">Tính năng</Link>
          <Link href="/#cach-hoat-dong" className="text-ink no-underline hover:underline">Cách hoạt động</Link>
          <Link href="/#rieng-tu" className="text-ink no-underline hover:underline">Riêng tư</Link>
        </nav>
        <div className="flex items-center gap-3">
          <details className="group relative md:hidden">
            <summary aria-label="Mở menu" className="btn-soft btn-sm cursor-pointer list-none">Menu</summary>
            <nav aria-label="Menu trên điện thoại" className="absolute right-0 top-[calc(100%+8px)] z-40 flex w-56 flex-col gap-1 rounded-2xl border border-line bg-warm p-3 text-[16px] shadow-lg">
              <Link href="/#cau-chuyen" className="rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper">Câu chuyện</Link>
              <Link href="/#tinh-nang" className="rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper">Tính năng</Link>
              <Link href="/#cach-hoat-dong" className="rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper">Cách hoạt động</Link>
              <Link href="/#rieng-tu" className="rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper">Riêng tư</Link>
              {!signedIn && <Link href="/login" className="rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper">Đăng nhập</Link>}
            </nav>
          </details>
          {signedIn ? (
            <Link href="/family" className="btn btn-sm">Mở sổ gia đình</Link>
          ) : (
            <>
              <Link href="/login" className="hidden px-2 text-[16px] text-ink sm:inline">Đăng nhập</Link>
              <Link href="/register" className="btn btn-sm">Tạo sổ gia đình</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-warm">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-[15.5px] text-stone">Mỗi gia đình, một câu chuyện. Mỗi ký ức, một điều còn mãi.</p>
        </div>
        <div className="text-[15.5px]">
          <p className="mb-3 font-medium">Sản phẩm</p>
          <ul className="space-y-2 text-stone">
            <li><Link href="/#tinh-nang" className="text-stone">Tính năng</Link></li>
            <li><Link href="/#cach-hoat-dong" className="text-stone">Cách hoạt động</Link></li>
            <li><Link href="/register" className="text-stone">Tạo sổ gia đình</Link></li>
          </ul>
        </div>
        <div className="text-[15.5px]">
          <p className="mb-3 font-medium">Thông tin</p>
          <ul className="space-y-2 text-stone">
            <li><Link href="/privacy" className="text-stone">Chính sách bảo mật</Link></li>
            <li><a href={`mailto:${contactEmail()}`} className="text-stone">{contactEmail()}</a></li>
          </ul>
        </div>
      </div>
      <p className="container-page pb-8 text-[13.5px] text-stone">© {new Date().getFullYear()} Memo. Phiên bản thử nghiệm: dữ liệu gia đình luôn thuộc về bạn.</p>
    </footer>
  );
}

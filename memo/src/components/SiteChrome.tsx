import { Link } from "react-router-dom";
import { Logo } from "./ui";
import { useSession } from "@/lib/session";

export const CONTACT_EMAIL: string = import.meta.env.VITE_CONTACT_EMAIL || "";

export function SiteHeader() {
  const { user } = useSession();
  return (
    <header className="header-safe sticky top-0 z-30 border-b border-line/70 bg-paper/90 backdrop-blur">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <Logo compact />
        <nav aria-label="Menu chính" className="hidden items-center gap-8 text-[16px] md:flex">
          <a href="/#cau-chuyen" className="text-ink no-underline hover:underline">Câu chuyện</a>
          <a href="/#tinh-nang" className="text-ink no-underline hover:underline">Tính năng</a>
          <a href="/#cach-hoat-dong" className="text-ink no-underline hover:underline">Cách hoạt động</a>
          <a href="/#rieng-tu" className="text-ink no-underline hover:underline">Riêng tư</a>
        </nav>
        <div className="flex items-center gap-2 whitespace-nowrap sm:gap-3">
          <details className="group relative md:hidden">
            <summary aria-label="Mở menu" className="btn-soft btn-sm cursor-pointer list-none">Menu</summary>
            <nav aria-label="Menu trên điện thoại" className="absolute right-0 top-[calc(100%+8px)] whitespace-normal z-40 flex w-56 flex-col gap-1 rounded-2xl border border-line bg-warm p-3 text-[16px] shadow-lg">
              <a href="/#cau-chuyen" className="rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper">Câu chuyện</a>
              <a href="/#tinh-nang" className="rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper">Tính năng</a>
              <a href="/#cach-hoat-dong" className="rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper">Cách hoạt động</a>
              <a href="/#rieng-tu" className="rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper">Riêng tư</a>
              {!user && <Link to="/login" className="rounded-lg px-3 py-2 text-ink no-underline hover:bg-paper">Đăng nhập</Link>}
            </nav>
          </details>
          {user ? (
            <Link to="/family" className="btn btn-sm">Mở sổ gia đình</Link>
          ) : (
            <>
              <Link to="/login" className="hidden px-2 text-[16px] text-ink sm:inline">Đăng nhập</Link>
              <Link to="/register" className="btn btn-sm">Tạo sổ gia đình</Link>
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
            <li><a href="/#tinh-nang" className="text-stone">Tính năng</a></li>
            <li><a href="/#cach-hoat-dong" className="text-stone">Cách hoạt động</a></li>
            <li><Link to="/register" className="text-stone">Tạo sổ gia đình</Link></li>
          </ul>
        </div>
        <div className="text-[15.5px]">
          <p className="mb-3 font-medium">Thông tin</p>
          <ul className="space-y-2 text-stone">
            <li><Link to="/privacy" className="text-stone">Chính sách bảo mật</Link></li>
            {CONTACT_EMAIL && <li><span className="select-all text-stone">{CONTACT_EMAIL}</span></li>}
          </ul>
        </div>
      </div>
      <p className="container-page pb-8 text-[13.5px] text-stone">© {new Date().getFullYear()} Memo. Phiên bản thử nghiệm: dữ liệu gia đình luôn thuộc về bạn.</p>
    </footer>
  );
}

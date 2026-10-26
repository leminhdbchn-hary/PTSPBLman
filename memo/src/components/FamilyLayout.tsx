import { useEffect, useRef } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loading, Logo } from "./ui";
import { useSession } from "@/lib/session";

const NAV = [
  { to: "/family", label: "Tổng quan", end: true },
  { to: "/family/memories", label: "Ký ức" },
  { to: "/family/stories", label: "Lời kể" },
  { to: "/family/members", label: "Thành viên" },
  { to: "/family/tree", label: "Gia phả" },
];

const Icon = ({ d }: { d: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);
const ICONS: Record<string, string> = {
  "/family": "M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-5h4v5",
  "/family/memories": "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M9 9.5h.01",
  "/family/stories": "M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 0 0-7 0v6A3.5 3.5 0 0 0 12 15zM6 11.5a6 6 0 0 0 12 0M12 17.5V21M9 21h6",
  "/family/members": "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M17 4.5a3.2 3.2 0 0 1 0 6M18.5 14.7c1.7.7 2.7 2.3 3 5.3",
  "/family/tree": "M12 4v5M12 9H6v4M12 9h6v4M6 13v3M18 13v3M4 19h4M16 19h4",
};

/** Khung chung của khu vực gia đình: yêu cầu đăng nhập và có ít nhất một gia đình. */
export function FamilyLayout() {
  const s = useSession();
  const loc = useLocation();
  const nav = useNavigate();
  // Vai trò có thể vừa được quản trị viên đổi: đọc lại danh sách gia đình khi chuyển trang (tối đa 20 giây/lần) và khi quay lại tab
  const last = useRef(Date.now());
  const { refresh, user } = s;
  useEffect(() => {
    if (!user || Date.now() - last.current < 20_000) return;
    last.current = Date.now();
    refresh().catch(() => {});
  }, [loc.pathname, refresh, user]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === "visible" && user) { last.current = Date.now(); refresh().catch(() => {}); } };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh, user]);
  if (s.loading) return <Loading />;
  if (!s.user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  if (!s.active) return <Navigate to="/onboarding" replace />;
  const isAdmin = s.active.role === "owner" || s.active.role === "admin";
  const canWrite = s.active.role !== "viewer";
  // Trang soạn thảo có thanh "Lưu" riêng ở đáy nên ẩn thanh điều hướng dưới
  const editing = /\/(new|edit)$/.test(loc.pathname);
  const logout = async () => { await s.fb?.auth.signOut(); nav("/"); };
  const closeMenu = (e: { currentTarget: HTMLElement }) => e.currentTarget.closest("details")?.removeAttribute("open");
  const item = "block w-full rounded-lg px-3 py-2.5 text-left text-[16px] text-ink no-underline hover:bg-paper";
  return (
    <>
      <header className="header-safe sticky top-0 z-30 border-b border-line/70 bg-paper/95 backdrop-blur">
        <div className="container-page flex h-[64px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <Logo to="/family" />
            <span className="max-w-[10rem] truncate border-l border-line pl-4 text-[15px] text-stone sm:max-w-[16rem]" title={s.active.name}>{s.active.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            {s.families.length > 1 && (
              <div className="hidden md:block">
                <label className="sr-only" htmlFor="switch">Chuyển gia đình</label>
                <select id="switch" value={s.active.id} onChange={(e) => { s.setActive(e.target.value); nav("/family"); }} className="input !min-h-0 !w-auto !py-1.5 !text-[15px]">
                  {s.families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
            {isAdmin && <Link to="/family/manage" className="btn-soft btn-sm hidden md:inline-flex">Quản lý</Link>}
            <Link to="/settings" className="btn-soft btn-sm hidden md:inline-flex">Cài đặt</Link>
            <button type="button" className="btn-soft btn-sm hidden md:inline-flex" onClick={logout}>Đăng xuất</button>
            <details className="relative md:hidden">
              <summary aria-label="Mở menu" className="btn-soft btn-sm cursor-pointer list-none">Menu</summary>
              <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 whitespace-normal rounded-2xl border border-line bg-warm p-2 shadow-lg">
                {s.families.length > 1 && s.families.map((f) => (
                  <button key={f.id} type="button" onClick={(e) => { s.setActive(f.id); closeMenu(e); nav("/family"); }} className={`${item} ${f.id === s.active!.id ? "font-medium" : "text-stone"}`}>{f.id === s.active!.id ? "✓ " : ""}{f.name}</button>
                ))}
                {s.families.length > 1 && <hr className="my-1 border-line" />}
                <Link to="/family/tree" onClick={closeMenu} className={item}>Gia phả</Link>
                {isAdmin && <Link to="/family/manage" onClick={closeMenu} className={item}>Quản lý &amp; mời người thân</Link>}
                <Link to="/settings" onClick={closeMenu} className={item}>Cài đặt</Link>
                <button type="button" className={item} onClick={logout}>Đăng xuất</button>
              </div>
            </details>
          </div>
        </div>
        <nav aria-label="Khu vực gia đình" className="container-page -mb-px hidden gap-1 pb-2 text-[16px] md:flex">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `whitespace-nowrap rounded-full px-4 py-1.5 no-underline ${isActive ? "bg-ink text-warm" : "text-ink hover:bg-line/60"}`}>{n.label}</NavLink>
          ))}
        </nav>
      </header>
      <main id="noi-dung" className={`container-page py-8 sm:py-14 ${editing ? "pb-32" : "max-md:pb-28"}`}>
        {/* đổi gia đình thì dựng lại toàn bộ trang con */}
        <Outlet key={s.active.id} />
      </main>
      {!editing && (
        <nav aria-label="Điều hướng chính" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-1.5">
            {[NAV[0], NAV[1]].map((n) => <TabItem key={n.to} {...n} />)}
            <li className="flex justify-center pb-1">
              {canWrite ? (
                <Link to="/family/memories/new" aria-label="Thêm ký ức mới" className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-ink text-warm shadow-lg no-underline">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
                </Link>
              ) : <span />}
            </li>
            {[NAV[2], NAV[3]].map((n) => <TabItem key={n.to} {...n} />)}
          </ul>
        </nav>
      )}
    </>
  );
}

function TabItem({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <li>
      <NavLink to={to} end={end} className={({ isActive }) => `flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-xl text-[12px] no-underline ${isActive ? "font-medium text-ink" : "text-stone"}`}>
        <Icon d={ICONS[to]} />
        {label}
      </NavLink>
    </li>
  );
}

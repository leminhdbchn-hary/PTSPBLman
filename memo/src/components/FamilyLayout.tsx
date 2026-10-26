import { useEffect, useRef } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ErrorState, Loading, Logo } from "./ui";
import { useSession } from "@/lib/session";

type Item = { to: string; label: string; end?: boolean };
const NAV: Item[] = [
  { to: "/family", label: "Trang chủ", end: true },
  { to: "/family/memories", label: "Ký ức" },
  { to: "/family/album", label: "Album" },
  { to: "/family/stories", label: "Lời kể" },
  { to: "/family/members", label: "Thành viên" },
  { to: "/family/tree", label: "Gia phả" },
];
// thanh dưới trên điện thoại: 4 mục chính + nút "+" ở giữa; phần còn lại nằm trong Menu
const TABS = [NAV[0], NAV[1], NAV[2], NAV[3]];

const ICONS: Record<string, string> = {
  "/family": "M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-5h4v5",
  "/family/memories": "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  "/family/album": "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M9 9.5h.01",
  "/family/stories": "M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 0 0-7 0v6A3.5 3.5 0 0 0 12 15zM6 11.5a6 6 0 0 0 12 0M12 17.5V21M9 21h6",
  "/family/members": "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5M17 4.5a3.2 3.2 0 0 1 0 6M18.5 14.7c1.7.7 2.7 2.3 3 5.3",
  "/family/tree": "M12 4v5M12 9H6v4M12 9h6v4M6 13v3M18 13v3M4 19h4M16 19h4",
};
const Icon = ({ to, size = 22 }: { to: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={ICONS[to]} /></svg>
);

/** Khung chung của khu vực gia đình: thanh bên (máy tính), thanh trên + thanh dưới (điện thoại). Yêu cầu đăng nhập và có ít nhất một gia đình. */
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
  if (s.familiesError) return <div className="container-page py-16"><ErrorState message={s.familiesError} onRetry={() => { void s.refresh().catch(() => {}); }} /></div>;
  if (!s.active) return <Navigate to="/onboarding" replace />;
  const isAdmin = s.active.role === "owner" || s.active.role === "admin";
  const canWrite = s.active.role !== "viewer";
  // Trang soạn thảo có thanh "Lưu" riêng ở đáy nên ẩn thanh điều hướng dưới
  const editing = /\/(new|edit)$/.test(loc.pathname);
  const logout = async () => { await s.fb?.auth.signOut(); nav("/"); };
  const closeMenu = (e: { currentTarget: HTMLElement }) => e.currentTarget.closest("details")?.removeAttribute("open");
  const item = "block w-full rounded-lg px-3 py-2.5 text-left text-[16px] text-ink no-underline hover:bg-sage-soft";
  const side = (active: boolean) => `flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15.5px] no-underline transition ${active ? "bg-sage-soft font-semibold text-mossdark" : "text-stone hover:bg-cream"}`;

  return (
    <div className="lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* ---- thanh bên (máy tính) ---- */}
      <aside className="hidden h-screen flex-col gap-6 border-r border-line bg-warm px-5 py-8 lg:sticky lg:top-0 lg:flex" aria-label="Thanh bên">
        <Logo to="/family" tagline />
        <nav aria-label="Khu vực gia đình" className="grid gap-1.5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => side(isActive)}><Icon to={n.to} />{n.label}</NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-4">
          <div className="rounded-2xl bg-cream p-4">
            <p className="eyebrow">Gia đình</p>
            <p className="mt-1 truncate font-serif text-[1.15rem]" title={s.active.name}>{s.active.name}</p>
            {s.families.length > 1 && (
              <>
                <label className="sr-only" htmlFor="switch">Chuyển gia đình</label>
                <select id="switch" value={s.active.id} onChange={(e) => { s.setActive(e.target.value); nav("/family"); }} className="input mt-2 !min-h-0 !py-2 !text-[15px]">
                  {s.families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </>
            )}
          </div>
          <div className="grid gap-1">
            {isAdmin && <NavLink to="/family/manage" className={({ isActive }) => side(isActive)}>Quản lý &amp; mời người thân</NavLink>}
            <Link to="/settings" className={side(false)}>Cài đặt</Link>
            <button type="button" className={`${side(false)} w-full text-left`} onClick={logout}>Đăng xuất</button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* ---- thanh trên (điện thoại) ---- */}
        <header className="header-safe sticky top-0 z-30 border-b border-line/70 bg-paper/95 backdrop-blur lg:hidden">
          <div className="container-page flex h-[64px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Logo to="/family" compact />
              <span className="max-w-[10rem] truncate border-l border-line pl-3 text-[15px] text-stone sm:max-w-[16rem]" title={s.active.name}>{s.active.name}</span>
            </div>
            <details className="relative shrink-0">
              <summary aria-label="Mở menu" className="btn-soft btn-sm cursor-pointer list-none">Menu</summary>
              <div role="menu" className="absolute right-0 top-[calc(100%+8px)] z-40 w-64 whitespace-normal rounded-2xl border border-line bg-warm p-2 shadow-lift">
                {s.families.length > 1 && s.families.map((f) => (
                  <button key={f.id} type="button" onClick={(e) => { s.setActive(f.id); closeMenu(e); nav("/family"); }} className={`${item} ${f.id === s.active!.id ? "font-medium" : "text-stone"}`}>{f.id === s.active!.id ? "✓ " : ""}{f.name}</button>
                ))}
                {s.families.length > 1 && <hr className="my-1 border-line" />}
                <Link to="/family/members" onClick={closeMenu} className={item}>Thành viên</Link>
                <Link to="/family/tree" onClick={closeMenu} className={item}>Gia phả</Link>
                {isAdmin && <Link to="/family/manage" onClick={closeMenu} className={item}>Quản lý &amp; mời người thân</Link>}
                <Link to="/settings" onClick={closeMenu} className={item}>Cài đặt</Link>
                <button type="button" className={item} onClick={logout}>Đăng xuất</button>
              </div>
            </details>
          </div>
        </header>
        <main id="noi-dung" className={`container-page py-8 sm:py-12 lg:px-12 lg:py-12 ${editing ? "pb-32 lg:pb-32" : "max-lg:pb-28"}`}>
          {/* đổi gia đình thì dựng lại toàn bộ trang con; key theo trang để chuyển cảnh nhẹ */}
          <div key={s.active.id + loc.pathname} className="page-in"><Outlet /></div>
        </main>
      </div>

      {/* ---- thanh dưới (điện thoại) ---- */}
      {!editing && (
        <nav aria-label="Điều hướng chính" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-warm/95 backdrop-blur lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <ul className="mx-auto grid max-w-md grid-cols-5 items-end px-2 pt-1.5">
            {[TABS[0], TABS[1]].map((n) => <TabItem key={n.to} {...n} />)}
            <li className="flex justify-center pb-1">
              {canWrite ? (
                <Link to="/family/memories/new" aria-label="Thêm ký ức mới" className="-mt-5 grid h-14 w-14 place-items-center rounded-full bg-sage text-white shadow-lift no-underline">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
                </Link>
              ) : <span />}
            </li>
            {[TABS[2], TABS[3]].map((n) => <TabItem key={n.to} {...n} />)}
          </ul>
        </nav>
      )}
    </div>
  );
}

function TabItem({ to, label, end }: Item) {
  return (
    <li>
      <NavLink to={to} end={end} className={({ isActive }) => `flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-xl text-[12px] no-underline ${isActive ? "font-semibold text-mossdark" : "text-stone"}`}>
        <Icon to={to} size={24} />
        {label}
      </NavLink>
    </li>
  );
}

import { useEffect, useRef } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loading, Logo } from "./ui";
import { useSession } from "@/lib/session";

const NAV = [
  { to: "/family", label: "Tổng quan", end: true },
  { to: "/family/memories", label: "Ký ức" },
  { to: "/family/members", label: "Thành viên" },
  { to: "/family/tree", label: "Gia phả" },
  { to: "/family/stories", label: "Lời kể" },
  { to: "/family/letters", label: "Thư" },
];

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
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/95 backdrop-blur">
        <div className="container-page flex h-[68px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <Logo to="/family" compact />
            <span className="hidden max-w-[16rem] truncate border-l border-line pl-4 text-[15px] text-stone sm:block" title={s.active.name}>{s.active.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap sm:gap-3">
            {s.families.length > 1 && (
              <div className="hidden sm:block">
                <label className="sr-only" htmlFor="switch">Chuyển gia đình</label>
                <select id="switch" value={s.active.id} onChange={(e) => { s.setActive(e.target.value); nav("/family"); }} className="input !min-h-0 !w-auto !py-1.5 !text-[15px]">
                  {s.families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
            {isAdmin && <Link to="/family/manage" className="btn-soft btn-sm">Quản lý</Link>}
            <Link to="/settings" className="btn-soft btn-sm">Cài đặt</Link>
            <button type="button" className="btn-soft btn-sm" onClick={async () => { await s.fb?.auth.signOut(); nav("/"); }}>Đăng xuất</button>
          </div>
        </div>
        <nav aria-label="Khu vực gia đình" className="container-page -mb-px flex gap-1 overflow-x-auto pb-2 text-[16px]">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `whitespace-nowrap rounded-full px-4 py-1.5 no-underline ${isActive ? "bg-ink text-warm" : "text-ink hover:bg-line/60"}`}>{n.label}</NavLink>
          ))}
        </nav>
      </header>
      <main id="noi-dung" className="container-page py-10 sm:py-14">
        {/* đổi gia đình thì dựng lại toàn bộ trang con */}
        <Outlet key={s.active.id} />
      </main>
    </>
  );
}

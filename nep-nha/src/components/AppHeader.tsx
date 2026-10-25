import Link from "next/link";
import { Logo } from "./ui";
import { switchFamily } from "@/app/actions/family";
import type { Ctx } from "@/lib/session";

const NAV = [
  { href: "/family", label: "Tổng quan" },
  { href: "/family/memories", label: "Ký ức" },
  { href: "/family/members", label: "Thành viên" },
  { href: "/family/tree", label: "Gia phả" },
  { href: "/family/stories", label: "Lời kể" },
  { href: "/family/letters", label: "Thư" },
];

export function AppHeader({ ctx, current }: { ctx: Ctx; current: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/95 backdrop-blur">
      <div className="container-page flex h-[68px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <Logo href="/family" />
          <span className="hidden max-w-[16rem] truncate border-l border-line pl-4 text-[15px] text-stone sm:block" title={ctx.family.name}>{ctx.family.name}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {ctx.families.length > 1 && (
            <form action={switchFamily} className="hidden sm:block">
              <label className="sr-only" htmlFor="switch">Chuyển gia đình</label>
              <select id="switch" name="id" defaultValue={ctx.family.id} className="input !min-h-0 !w-auto !py-1.5 !text-[15px]">
                {ctx.families.map((f) => <option key={f.family.id} value={f.family.id}>{f.family.name}</option>)}
              </select>
              <button className="btn-soft btn-sm ml-2" type="submit">Chuyển</button>
            </form>
          )}
          {ctx.isAdmin && <Link prefetch={false} href="/family/manage" className="btn-soft btn-sm">Quản lý</Link>}
          <Link prefetch={false} href="/settings" className="btn-soft btn-sm">Cài đặt</Link>
          <form action="/auth/signout" method="post"><button type="submit" className="btn-soft btn-sm">Đăng xuất</button></form>
        </div>
      </div>
      <nav aria-label="Khu vực gia đình" className="container-page -mb-px flex gap-1 overflow-x-auto pb-2 text-[16px]">
        {NAV.map((n) => {
          const on = current === n.href || (n.href !== "/family" && current.startsWith(n.href));
          return (
            <Link key={n.href} prefetch={false} href={n.href} aria-current={on ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 no-underline ${on ? "bg-ink text-warm" : "text-ink hover:bg-line/60"}`}>{n.label}</Link>
          );
        })}
      </nav>
    </header>
  );
}

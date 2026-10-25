import Link from "next/link";
import { initials } from "@/lib/utils";

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: React.ReactNode }) {
  const c = kind === "error" ? "border-[#e2b9ab] bg-[#fbeee8] text-[#7d3220]" : kind === "success" ? "border-[#c5cdb5] bg-[#f0f3e8] text-mossdark" : "border-line bg-warm text-ink";
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-[15.5px] ${c}`}>
      {children}
    </div>
  );
}

export function Field({ label, name, hint, error, children }: { label: string; name: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {hint && !error && <p className="hint" id={name + "-hint"}>{hint}</p>}
      {error && <p className="mt-1.5 text-[14px] text-[#8c3b25]" role="alert" id={name + "-err"}>{error}</p>}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="card mx-auto max-w-read px-6 py-12 text-center">
      <h2 className="text-2xl">{title}</h2>
      {children && <div className="mx-auto mt-3 max-w-md text-stone">{children}</div>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Avatar({ name, url, size = 48 }: { name: string; url?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  return url ? (
    <img src={url} alt="" className="shrink-0 rounded-full object-cover" style={style} />
  ) : (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#e4dccb] font-serif text-ink" style={style}>
      {initials(name)}
    </span>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-[2.1rem] sm:text-[2.6rem]">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}

export function LinkBtn({ href, children, soft, sm }: { href: string; children: React.ReactNode; soft?: boolean; sm?: boolean }) {
  return <Link href={href} className={`${soft ? "btn-soft" : "btn"} ${sm ? "btn-sm" : ""}`}>{children}</Link>;
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-serif text-[1.45rem] text-ink no-underline" aria-label="Nếp Nhà — trang chủ">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <path d="M3 12.5 13 4l10 8.5" stroke="#51473D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 11v10h14V11" stroke="#51473D" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10.5 21v-6h5v6" stroke="#7A816D" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      Nếp Nhà
    </Link>
  );
}

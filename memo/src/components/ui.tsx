import { Link } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { initials } from "@/lib/utils";

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: ReactNode }) {
  const c = kind === "error" ? "border-[#e2b9ab] bg-[#fbeee8] text-[#7d3220]" : kind === "success" ? "border-[#c5cdb5] bg-[#f0f3e8] text-mossdark" : "border-line bg-warm text-ink";
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-[15.5px] ${c}`}>
      {children}
    </div>
  );
}

export function Field({ label, name, hint, error, children }: { label: string; name: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {hint && !error && <p className="hint" id={name + "-hint"}>{hint}</p>}
      {error && <p className="mt-1.5 text-[14px] text-[#8c3b25]" role="alert" id={name + "-err"}>{error}</p>}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
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

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  useEffect(() => { document.title = `${title} · Memo`; }, [title]);
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

export function LinkBtn({ to, children, soft, sm }: { to: string; children: ReactNode; soft?: boolean; sm?: boolean }) {
  return <Link to={to} className={`${soft ? "btn-soft" : "btn"} ${sm ? "btn-sm" : ""}`}>{children}</Link>;
}

/** compact: trên điện thoại chỉ hiện biểu tượng để thanh trên không bị xuống dòng. */
export function Logo({ to = "/", compact }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center gap-2.5 whitespace-nowrap font-serif text-[1.45rem] text-ink no-underline" aria-label="Memo — trang chủ">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
        <path d="M3 12.5 13 4l10 8.5" stroke="#51473D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 11v10h14V11" stroke="#51473D" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M10.5 21v-6h5v6" stroke="#7A816D" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span className={compact ? "hidden sm:inline" : ""}>Memo</span>
    </Link>
  );
}

export function Loading({ label = "Đang mở trang sổ…" }: { label?: string }) {
  return <p className="py-16 text-center text-stone" role="status">{label}</p>;
}

/** Nút gửi có trạng thái "đang xử lý". */
export function Submit({ busy, children, className = "btn", busyText = "Đang xử lý…" }: { busy: boolean; children: ReactNode; className?: string; busyText?: string }) {
  return <button type="submit" className={className} disabled={busy} aria-busy={busy}>{busy ? busyText : children}</button>;
}

/** Nút cần xác nhận hai bước ngay trên trang (không dùng hộp thoại của trình duyệt). */
export function ConfirmButton({ label, confirmLabel = "Chắc chắn", question, onConfirm, className = "btn-danger btn-sm" }: {
  label: string; confirmLabel?: string; question: string; onConfirm: () => Promise<void> | void; className?: string;
}) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!asking) return <button type="button" className={className} onClick={() => setAsking(true)}>{label}</button>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-[#e2b9ab] bg-[#fbeee8] px-3 py-2 text-[15px] text-[#7d3220]" role="group" aria-label={question}>
      <span>{question}</span>
      <button type="button" className="btn-danger btn-sm" disabled={busy} onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); setAsking(false); } }}>{busy ? "Đang xử lý…" : confirmLabel}</button>
      <button type="button" className="btn-soft btn-sm" disabled={busy} onClick={() => setAsking(false)}>Thôi</button>
    </span>
  );
}

export function CopyField({ value, label = "Liên kết mời" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={value} className="input text-[15px]" aria-label={label} onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="btn-soft btn-sm shrink-0" onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* người dùng tự sao chép từ ô bên cạnh */ } }}>
        {copied ? "Đã chép" : "Sao chép"}
      </button>
    </div>
  );
}

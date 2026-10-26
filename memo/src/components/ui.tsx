import { Link } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { initials } from "@/lib/utils";

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: ReactNode }) {
  const c = kind === "error" ? "border-danger-line bg-danger-bg text-danger-deep" : kind === "success" ? "border-success-line bg-success-bg text-mossdark" : "border-line bg-warm text-ink";
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
      {error && <p className="mt-1.5 text-[14px] text-danger" role="alert" id={name + "-err"}>{error}</p>}
    </div>
  );
}

/** Hình minh hoạ nhỏ cho trạng thái trống: khung ảnh nghiêng + trái tim, cùng ngôn ngữ với trang chủ. */
export function EmptyArt() {
  return (
    <svg width="96" height="84" viewBox="0 0 96 84" fill="none" aria-hidden className="mx-auto">
      <rect x="22" y="12" width="52" height="60" rx="4" transform="rotate(-7 48 42)" fill="#FFFEFA" stroke="#DCE7DA" strokeWidth="2" />
      <rect x="28" y="18" width="40" height="34" rx="2" transform="rotate(-7 48 42)" fill="#DCE7DA" />
      <path d="M48 48s-9-5.5-9-11.5c0-3.2 2.3-5.2 4.8-5.2 1.8 0 3.3 1 4.2 2.5.9-1.5 2.4-2.5 4.2-2.5 2.5 0 4.8 2 4.8 5.2C57 42.5 48 48 48 48z" transform="rotate(-7 48 42)" fill="#EAC8BA" />
    </svg>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card page-in mx-auto max-w-read bg-cream/60 px-6 py-12 text-center">
      <EmptyArt />
      <h2 className="mt-4 text-2xl">{title}</h2>
      {children && <div className="mx-auto mt-3 max-w-md text-stone">{children}</div>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/** Trạng thái lỗi tải dữ liệu: nói rõ chuyện gì xảy ra và cho thử lại. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card mx-auto max-w-read border-danger-line bg-danger-bg/60 px-6 py-10 text-center">
      <span aria-hidden className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-danger-bg text-[1.5rem] text-danger">!</span>
      <h2 className="text-[1.35rem]">Chưa mở được trang này</h2>
      <p className="mx-auto mt-2 max-w-md text-danger-deep">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onRetry && <button type="button" className="btn" onClick={onRetry}>Thử lại</button>}
        <Link to="/family" className="btn-soft">Về trang chủ</Link>
      </div>
    </div>
  );
}

export function Avatar({ name, url, size = 48 }: { name: string; url?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  return url ? (
    <img src={url} alt="" className="shrink-0 rounded-full object-cover" style={style} decoding="async" />
  ) : (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full bg-sage-soft font-serif text-mossdark" style={style}>
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
        <h1 className="text-[2rem] sm:text-[2.5rem]">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  );
}

export function LinkBtn({ to, children, soft, sm }: { to: string; children: ReactNode; soft?: boolean; sm?: boolean }) {
  return <Link to={to} className={`${soft ? "btn-soft" : "btn"} ${sm ? "btn-sm" : ""}`}>{children}</Link>;
}

export function HeartMark({ size = 40 }: { size?: number }) {
  return (
    <span aria-hidden className="grid shrink-0 place-items-center rounded-[14px] bg-sage-soft text-moss" style={{ width: size, height: size }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-8-4.9-8-10.3C4 7.8 6 6 8.3 6c1.6 0 2.9.9 3.7 2.2C12.8 6.9 14.1 6 15.7 6 18 6 20 7.8 20 10.7 20 16.1 12 21 12 21z" /></svg>
    </span>
  );
}

/** compact: trên điện thoại chỉ hiện biểu tượng để thanh trên không bị xuống dòng. */
export function Logo({ to = "/", compact, tagline }: { to?: string; compact?: boolean; tagline?: boolean }) {
  return (
    <Link to={to} className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center gap-3 whitespace-nowrap text-ink no-underline" aria-label="Memo — trang chủ">
      <HeartMark />
      <span className={`font-sans text-[1.7rem] font-bold leading-none tracking-tight ${compact ? "hidden sm:inline" : ""}`}>
        memo<span className="text-[#A8BD9B]">.</span>
        {tagline && <small className="mt-1 block text-[10px] font-medium uppercase tracking-[0.13em] text-stone">Our little forever</small>}
      </span>
    </Link>
  );
}

/** Khung xương khi đang tải: giữ chỗ để trang không giật. Có chữ ẩn cho trình đọc màn hình. */
export function Loading({ label = "Đang mở trang sổ…", variant = "list" }: { label?: string; variant?: "list" | "detail" }) {
  return (
    <div role="status" aria-busy="true" className="page-in">
      <span className="sr-only">{label}</span>
      <div aria-hidden>
        <div className="skeleton mb-3 h-3 w-28" />
        <div className="skeleton mb-8 h-10 w-3/4 max-w-md" />
        {variant === "detail" ? (
          <>
            <div className="skeleton mb-6 aspect-[3/2] w-full max-w-3xl rounded-2xl" />
            <div className="skeleton mb-3 h-4 w-full max-w-3xl" /><div className="skeleton h-4 w-2/3 max-w-3xl" />
          </>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card overflow-hidden"><div className="skeleton aspect-[4/3] rounded-none" /><div className="space-y-3 p-5"><div className="skeleton h-3 w-24" /><div className="skeleton h-5 w-4/5" /></div></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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
    <span className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-danger-line bg-danger-bg px-3 py-2 text-[15px] text-danger-deep" role="group" aria-label={question}>
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

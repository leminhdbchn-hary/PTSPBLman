"use client";
import { useState } from "react";

export function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <input readOnly value={value} className="input text-[15px]" aria-label="Liên kết mời" onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="btn-soft btn-sm shrink-0" onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* người dùng tự sao chép từ ô bên cạnh */ } }}>
        {copied ? "Đã chép" : "Sao chép"}
      </button>
    </div>
  );
}

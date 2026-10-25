"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, pending: pendingText = "Đang xử lý…", className = "btn" }: { children: React.ReactNode; pending?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

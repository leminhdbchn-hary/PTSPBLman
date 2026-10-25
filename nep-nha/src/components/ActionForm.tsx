"use client";
import { useRouter } from "next/navigation";

/** Form gọi server action rồi tự làm mới trang (xem useRefreshOnOk). Dành cho action không trả về giá trị. */
export function ActionForm({ action, className, children }: { action: (formData: FormData) => unknown | Promise<unknown>; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <form className={className} action={async (fd) => { await action(fd); router.refresh(); }}>
      {children}
    </form>
  );
}

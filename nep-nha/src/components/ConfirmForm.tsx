"use client";
import { useRouter } from "next/navigation";
import { SubmitButton } from "./SubmitButton";

/** Form có hộp xác nhận trước khi gửi (xoá, rời gia đình…). Server action vẫn tự kiểm tra quyền. */
export function ConfirmForm({ action, message, label, className = "btn-danger btn-sm", children }: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  label: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <form
      action={async (fd) => { await action(fd); router.refresh(); }}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
      <SubmitButton className={className}>{label}</SubmitButton>
    </form>
  );
}

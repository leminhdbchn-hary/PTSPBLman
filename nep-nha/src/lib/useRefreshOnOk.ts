"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Làm mới dữ liệu trang sau khi server action báo thành công.
 * Dùng thay cho revalidatePath() trong action: khi thao tác liên tiếp nhanh, Next 15.5 đôi khi để nút "Đang lưu…" đứng hình
 * nếu phản hồi của action còn mang theo cả cây RSC mới (thấy trong test đầu-cuối). router.refresh() là một yêu cầu riêng nên không bị.
 */
export function useRefreshOnOk(state: { ok?: boolean }) {
  const router = useRouter();
  useEffect(() => { if (state.ok) router.refresh(); }, [state, router]);
}

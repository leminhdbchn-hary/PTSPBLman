import Link from "next/link";
import type { Metadata } from "next";
import { ResetForm } from "@/components/auth-forms";
import { Notice } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Đặt mật khẩu mới" };

export default async function ResetPage() {
  let signedIn = false;
  if (isConfigured()) {
    const { data } = await (await createClient()).auth.getUser();
    signedIn = !!data.user;
  }
  return (
    <>
      <h1 className="text-[2rem]">Đặt mật khẩu mới</h1>
      {signedIn ? (
        <div className="mt-7"><ResetForm /></div>
      ) : (
        <div className="mt-6 space-y-5">
          <Notice kind="error">Liên kết đặt lại mật khẩu đã hết hạn hoặc đã được dùng.</Notice>
          <Link href="/forgot-password" className="btn w-full">Yêu cầu liên kết mới</Link>
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function ForgotPage() {
  return (
    <>
      <h1 className="text-[2rem]">Quên mật khẩu</h1>
      <p className="mb-7 mt-2 text-stone">Nhập email, chúng tôi sẽ gửi liên kết để bạn đặt mật khẩu mới.</p>
      <ForgotForm />
      <p className="mt-7 text-center text-[15.5px]"><Link href="/login" className="text-ink underline">Quay lại đăng nhập</Link></p>
    </>
  );
}

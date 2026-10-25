import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-[2rem]">Chào mừng trở lại</h1>
      <p className="mb-7 mt-2 text-stone">Đăng nhập để mở sổ ký ức của gia đình bạn.</p>
      {sp.error && <p role="alert" className="mb-5 rounded-xl border border-[#e2b9ab] bg-[#fbeee8] px-4 py-3 text-[15px] text-[#7d3220]">{sp.error}</p>}
      <LoginForm next={sp.next ? safeNext(sp.next) : undefined} />
      <p className="mt-7 text-center text-[15.5px]">Chưa có tài khoản? <Link href={sp.next ? `/register?next=${encodeURIComponent(safeNext(sp.next))}` : "/register"} className="font-medium text-ink underline">Tạo sổ gia đình</Link></p>
    </>
  );
}

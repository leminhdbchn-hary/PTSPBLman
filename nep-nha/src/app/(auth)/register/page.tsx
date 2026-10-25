import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Tạo sổ gia đình" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-[2rem]">Tạo sổ gia đình</h1>
      <p className="mb-7 mt-2 text-stone">Chỉ mất một phút. Bạn sẽ tạo không gian riêng tư cho gia đình ở bước tiếp theo.</p>
      <RegisterForm next={sp.next ? safeNext(sp.next) : undefined} />
      <p className="mt-7 text-center text-[15.5px]">Đã có tài khoản? <Link href={sp.next ? `/login?next=${encodeURIComponent(safeNext(sp.next))}` : "/login"} className="font-medium text-ink underline">Đăng nhập</Link></p>
    </>
  );
}

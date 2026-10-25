import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInviteButton } from "@/components/onboarding-forms";
import { Logo, Notice } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/env";
import { ROLE_LABEL, type FamilyRole } from "@/lib/types";

export const metadata: Metadata = { title: "Lời mời vào gia đình", robots: { index: false, follow: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = /^[0-9a-f]{20,128}$/.test(token);
  let info: { family_name: string; role: FamilyRole; valid: boolean } | null = null;
  let signedIn = false;
  if (isConfigured() && valid) {
    const supabase = await createClient();
    signedIn = !!(await supabase.auth.getUser()).data.user;
    const { data } = await supabase.rpc("preview_invitation", { p_token: token });
    info = ((data ?? []) as { family_name: string; role: FamilyRole; valid: boolean }[])[0] ?? null;
  }
  const next = `/invite/${token}`;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-page flex h-20 items-center"><Logo /></header>
      <main id="noi-dung" className="flex flex-1 items-start justify-center px-5 pb-20 pt-6 sm:pt-12">
        <div className="card w-full max-w-md p-8 text-center">
          {!isConfigured() ? <Notice kind="error">Website chưa được cấu hình Supabase.</Notice>
            : !info || !info.valid ? (
              <>
                <h1 className="text-[1.9rem]">Lời mời không dùng được</h1>
                <p className="mt-3 text-stone">Liên kết có thể đã hết hạn, đã được dùng hoặc bị thu hồi. Hãy nhờ người thân gửi lại lời mời mới nhé.</p>
                <Link href="/" className="btn-soft mt-7">Về trang chủ</Link>
              </>
            ) : (
              <>
                <p className="eyebrow mb-3">Bạn được mời</p>
                <h1 className="text-[2rem]">Tham gia “{info.family_name}”</h1>
                <p className="mb-7 mt-3 text-stone">Với vai trò <strong className="text-ink">{ROLE_LABEL[info.role]}</strong>. Bạn sẽ cùng xem và đóng góp vào cuốn sổ ký ức của gia đình.</p>
                {signedIn ? <AcceptInviteButton token={token} /> : (
                  <div className="space-y-3">
                    <Link href={`/register?next=${encodeURIComponent(next)}`} className="btn w-full">Tạo tài khoản để tham gia</Link>
                    <Link href={`/login?next=${encodeURIComponent(next)}`} className="btn-soft w-full">Tôi đã có tài khoản</Link>
                  </div>
                )}
              </>
            )}
        </div>
      </main>
    </div>
  );
}

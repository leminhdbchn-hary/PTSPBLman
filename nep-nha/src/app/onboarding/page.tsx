import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateFamilyForm } from "@/components/onboarding-forms";
import { Logo } from "@/components/ui";
import { getFamilyCtx, getProfile } from "@/lib/session";

export const metadata: Metadata = { title: "Bắt đầu" };

export default async function Onboarding() {
  const ctx = await getFamilyCtx();
  if (ctx) redirect("/family");
  const profile = await getProfile();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-page flex h-20 items-center"><Logo href="/onboarding" /></header>
      <main id="noi-dung" className="flex flex-1 items-start justify-center px-5 pb-20 pt-6 sm:pt-12">
        <div className="w-full max-w-md">
          <p className="eyebrow mb-3">Chào {profile.full_name || "bạn"}</p>
          <h1 className="text-[2.2rem]">Hãy đặt tên cho gia đình</h1>
          <p className="mb-8 mt-3 text-stone">Đây sẽ là cuốn sổ riêng của gia đình bạn. Bạn là chủ sở hữu và quyết định mời ai vào.</p>
          <div className="card p-7"><CreateFamilyForm /></div>
          <p className="mt-8 text-center text-[15.5px] text-stone">Được người thân mời? Hãy mở liên kết mời họ đã gửi, bạn sẽ vào thẳng gia đình đó.</p>
        </div>
      </main>
    </div>
  );
}

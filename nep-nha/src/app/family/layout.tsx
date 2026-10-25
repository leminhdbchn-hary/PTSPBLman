import { headers } from "next/headers";
import { AppHeader } from "@/components/AppHeader";
import { requireFamily } from "@/lib/session";

export default async function FamilyLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireFamily();
  const h = await headers();
  const path = h.get("x-pathname") ?? "/family";
  return (
    <>
      <AppHeader ctx={ctx} current={path} />
      <main id="noi-dung" className="container-page py-10 sm:py-14">{children}</main>
    </>
  );
}

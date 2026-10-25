import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireFamily } from "@/lib/session";
import { PersonForm } from "@/components/PersonForm";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Thêm hồ sơ" };

export default async function NewPerson() {
  const ctx = await requireFamily();
  if (!ctx.canWrite) redirect("/family/members");
  return (
    <>
      <PageTitle eyebrow="Thành viên" title="Thêm một hồ sơ" />
      <PersonForm familyId={ctx.family.id} initial={{ full_name: "", relation_label: "", birth_date: "", birth_date_visible: false, bio: "", avatar_url: null }} />
    </>
  );
}

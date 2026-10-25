import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireFamily } from "@/lib/session";
import { listPeople } from "@/lib/data/people";
import { MemoryForm } from "@/components/MemoryForm";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Thêm ký ức" };

export default async function NewMemory() {
  const ctx = await requireFamily();
  if (!ctx.canWrite) redirect("/family/memories");
  const people = await listPeople(ctx);
  return (
    <>
      <PageTitle eyebrow="Trang mới" title="Thêm một ký ức" />
      <MemoryForm familyId={ctx.family.id} people={people.map((p) => ({ id: p.id, full_name: p.full_name }))} canSeeAdminsOnly={ctx.isAdmin}
        initial={{ title: "", body: "", happened_on: "", location: "", tags: [], visibility: "family", personIds: [], media: [] }} />
    </>
  );
}

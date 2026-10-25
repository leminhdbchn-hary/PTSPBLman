import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireFamily } from "@/lib/session";
import { listPeople } from "@/lib/data/people";
import { getMemory } from "@/lib/data/memories";
import { MemoryForm } from "@/components/MemoryForm";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Sửa ký ức" };

export default async function EditMemory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const people = await listPeople(ctx);
  const m = await getMemory(ctx, id, people);
  if (!m) notFound();
  if (!(ctx.isAdmin || (ctx.canWrite && m.created_by === ctx.user.id))) redirect(`/family/memories/${id}`);
  return (
    <>
      <PageTitle eyebrow="Chỉnh sửa" title={m.title} />
      <MemoryForm familyId={ctx.family.id} people={people.map((p) => ({ id: p.id, full_name: p.full_name }))} canSeeAdminsOnly={ctx.isAdmin}
        initial={{ id: m.id, title: m.title, body: m.body, happened_on: m.happened_on ?? "", location: m.location ?? "", tags: m.tags, visibility: m.visibility, personIds: m.people.map((p) => p.id), media: m.media.map((x) => ({ id: x.id, url: x.url })) }} />
    </>
  );
}

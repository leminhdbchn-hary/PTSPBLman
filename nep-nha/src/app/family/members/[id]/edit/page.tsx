import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireFamily } from "@/lib/session";
import { getPerson } from "@/lib/data/people";
import { PersonForm } from "@/components/PersonForm";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Sửa hồ sơ" };

export default async function EditPerson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const p = await getPerson(ctx, id);
  if (!p) notFound();
  if (!(ctx.isAdmin || (ctx.canWrite && (p.created_by === ctx.user.id || p.user_id === ctx.user.id)))) redirect(`/family/members/${id}`);
  return (
    <>
      <PageTitle eyebrow="Chỉnh sửa" title={p.full_name} />
      <PersonForm familyId={ctx.family.id} initial={{ id: p.id, full_name: p.full_name, relation_label: p.relation_label ?? "", birth_date: p.birth_date ?? "", birth_date_visible: p.birth_date_visible, bio: p.bio ?? "", avatar_url: p.avatar_url }} />
    </>
  );
}

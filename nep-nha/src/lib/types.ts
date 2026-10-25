export type FamilyRole = "owner" | "admin" | "contributor" | "viewer";
export type Visibility = "family" | "admins" | "private";

export const ROLE_LABEL: Record<FamilyRole, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  contributor: "Đóng góp",
  viewer: "Chỉ xem",
};
export const ROLE_HELP: Record<FamilyRole, string> = {
  owner: "Toàn quyền, kể cả xoá gia đình và chuyển quyền chủ sở hữu.",
  admin: "Mời và quản lý thành viên, sửa và xoá mọi ký ức.",
  contributor: "Thêm ký ức, hồ sơ; sửa và xoá những gì mình tạo.",
  viewer: "Chỉ xem, không thêm hay sửa nội dung.",
};
export const VISIBILITY_LABEL: Record<Visibility, string> = {
  family: "Cả gia đình",
  admins: "Chỉ quản trị viên",
  private: "Chỉ mình tôi",
};

export type Family = { id: string; name: string; description: string | null; cover_path: string | null; created_at: string };
export type Membership = { family_id: string; user_id: string; role: FamilyRole; joined_at: string };
export type Profile = { id: string; full_name: string; avatar_path: string | null; bio: string | null; deletion_requested_at: string | null };
export type Person = {
  id: string;
  family_id: string;
  user_id: string | null;
  full_name: string;
  relation_label: string | null;
  birth_date: string | null;
  birth_date_visible: boolean;
  bio: string | null;
  avatar_path: string | null;
  is_demo: boolean;
  created_by: string | null;
};
export type MediaRow = {
  id: string;
  memory_id: string;
  storage_path: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  caption: string | null;
  sort_order: number;
};
export type Memory = {
  id: string;
  family_id: string;
  title: string;
  body: string;
  happened_on: string | null;
  location: string | null;
  tags: string[];
  visibility: Visibility;
  is_demo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
export type MemoryWithExtras = Memory & { media: (MediaRow & { url: string | null })[]; people: Pick<Person, "id" | "full_name">[]; author_name: string | null };
export type Relationship = { id: string; family_id: string; person_a: string; person_b: string; kind: "parent" | "spouse" };
export type Invitation = { id: string; email: string | null; role: FamilyRole; created_at: string; expires_at: string; accepted_at: string | null; revoked_at: string | null };

export const THEME_TAGS = ["Tuổi thơ", "Ngày cưới", "Sinh nhật", "Chuyến đi", "Bữa cơm gia đình", "Thành tựu", "Những người thân yêu", "Ngày bình thường đáng nhớ"] as const;

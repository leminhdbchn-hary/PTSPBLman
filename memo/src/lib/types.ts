import type { Timestamp } from "firebase/firestore";

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
  admin: "Mời và quản lý thành viên, sửa và xoá ký ức của mọi người (trừ ký ức riêng tư).",
  contributor: "Thêm ký ức, hồ sơ; sửa và xoá những gì mình tạo.",
  viewer: "Xem và bình luận, không thêm hay sửa nội dung.",
};
export const VISIBILITY_LABEL: Record<Visibility, string> = {
  family: "Cả gia đình",
  admins: "Chỉ quản trị viên",
  private: "Chỉ mình tôi",
};

export type Family = { id: string; name: string; description: string | null; ownerId: string; closing: boolean };
export type MyFamily = { id: string; name: string; role: FamilyRole };
export type Member = { uid: string; role: FamilyRole; name: string; joinedAt: Timestamp | null };
export type Profile = { fullName: string; bio: string | null; email: string };

export type Person = {
  id: string;
  fullName: string;
  relationLabel: string | null;
  birthDate: string | null;
  birthDateVisible: boolean;
  bio: string | null;
  avatar: string | null;
  userId: string | null;
  isDemo: boolean;
  createdBy: string;
};
export type Memory = {
  id: string;
  title: string;
  body: string;
  happenedOn: string | null;
  location: string | null;
  tags: string[];
  visibility: Visibility;
  personIds: string[];
  photoIds: string[];
  cover: string | null;
  demoImages: string[];
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  isDemo: boolean;
};
export type Photo = { id: string; memoryId: string; data: string; w: number; h: number; createdBy: string };
export type Comment = { id: string; body: string; authorId: string; authorName: string; createdAt: Timestamp | null };
export type Relationship = { id: string; a: string; b: string; kind: "parent" | "spouse"; createdBy: string; isDemo: boolean };
export type Invite = {
  id: string;
  familyId: string;
  familyName: string;
  role: FamilyRole;
  email: string | null;
  createdBy: string;
  createdAt: Timestamp | null;
  expiresAt: Timestamp;
  acceptedBy: string | null;
  acceptedAt: Timestamp | null;
  revoked: boolean;
};

export const THEME_TAGS = ["Tuổi thơ", "Ngày cưới", "Sinh nhật", "Chuyến đi", "Bữa cơm gia đình", "Thành tựu", "Những người thân yêu", "Ngày bình thường đáng nhớ"] as const;

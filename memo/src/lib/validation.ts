import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => text(max).optional().transform((v) => (v ? v : null));
const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Ngày không hợp lệ");
const optionalDate = dateStr.optional().or(z.literal("").transform(() => undefined)).transform((v) => v ?? null);

export const emailSchema = z.string().trim().toLowerCase().email("Email chưa đúng định dạng").max(254);
export const passwordSchema = z
  .string()
  .min(8, "Mật khẩu cần ít nhất 8 ký tự")
  .max(72, "Mật khẩu tối đa 72 ký tự")
  .refine((v) => /[A-Za-zÀ-ỹ]/.test(v) && /\d/.test(v), "Mật khẩu cần có cả chữ và số");

export const registerSchema = z.object({
  fullName: text(100).min(1, "Bạn nhập họ tên nhé"),
  email: emailSchema,
  password: passwordSchema,
});
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Bạn nhập mật khẩu nhé").max(72) });

export const familySchema = z.object({
  name: text(80).min(1, "Bạn đặt tên cho gia đình nhé"),
  description: optionalText(500),
});

export const MAX_TAGS = 8;
/** "Chuyến đi, Sinh nhật ,  " → ["Chuyến đi","Sinh nhật"] (bỏ trùng, tối đa 8 thẻ, mỗi thẻ ≤ 24 ký tự). */
export function parseTags(input: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(input) ? input : String(input ?? "").split(",");
  const out: string[] = [];
  for (const t of raw) {
    const v = t.replace(/\s+/g, " ").trim().slice(0, 24);
    if (v && !out.some((x) => x.toLowerCase() === v.toLowerCase())) out.push(v);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

const docId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Mã không hợp lệ");

export const memorySchema = z.object({
  title: text(140).min(1, "Bạn đặt tiêu đề cho ký ức nhé"),
  body: text(10000).default(""),
  happenedOn: optionalDate,
  location: optionalText(120),
  tags: z.union([z.string(), z.array(z.string())]).default("").transform((v) => parseTags(v)),
  visibility: z.enum(["family", "admins", "private"]).default("family"),
  personIds: z.array(docId).max(30).default([]),
});
export type MemoryInput = z.infer<typeof memorySchema>;

export const personSchema = z.object({
  fullName: text(100).min(1, "Bạn nhập họ tên nhé"),
  relationLabel: optionalText(40),
  birthDate: optionalDate,
  birthDateVisible: z.boolean().default(false),
  bio: optionalText(3000),
});
export type PersonInput = z.infer<typeof personSchema>;

export const inviteSchema = z.object({
  email: z.union([emailSchema, z.literal("")]).transform((v) => v || null),
  role: z.enum(["admin", "contributor", "viewer"]),
  days: z.coerce.number().int().min(1).max(30).default(7),
});

export const profileSchema = z.object({ fullName: text(100).min(1, "Bạn nhập họ tên nhé"), bio: optionalText(1000) });
export const commentSchema = z.object({ body: text(2000).min(1, "Bạn viết gì đó trước nhé") });

/** Giới hạn ảnh. Ảnh được nén ngay trên máy rồi lưu trong Firestore (mỗi tài liệu tối đa 1 MB). */
export const MEDIA_LIMITS = {
  maxInputBytes: 30 * 1024 * 1024,
  maxPerMemory: 12,
  maxStoredChars: 950_000,
  inputMimes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif"],
} as const;

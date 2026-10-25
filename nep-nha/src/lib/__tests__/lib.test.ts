import { describe, expect, it } from "vitest";
import { parseTags, memorySchema, registerSchema, inviteSchema, passwordSchema, mediaMetaSchema } from "../validation";
import { safeNext, formatDate, sanitizeSearch, initials, clampInt, randomToken } from "../utils";
import { layoutTree, wouldCreateCycle } from "../tree";
import type { Person, Relationship } from "../types";

const person = (id: string, name: string): Person => ({ id, family_id: "f", user_id: null, full_name: name, relation_label: null, birth_date: null, birth_date_visible: false, bio: null, avatar_path: null, is_demo: false, created_by: null });
const rel = (a: string, b: string, kind: "parent" | "spouse" = "parent"): Relationship => ({ id: a + b, family_id: "f", person_a: a, person_b: b, kind });

describe("validation", () => {
  it("parseTags bỏ trùng, cắt gọn, tối đa 8 thẻ", () => {
    expect(parseTags(" Chuyến đi, sinh nhật ,,Chuyến đi ")).toEqual(["Chuyến đi", "sinh nhật"]);
    expect(parseTags(Array.from({ length: 20 }, (_, i) => "t" + i).join(","))).toHaveLength(8);
    expect(parseTags("x".repeat(60))[0]).toHaveLength(24);
    expect(parseTags(null)).toEqual([]);
  });
  it("memorySchema: tiêu đề bắt buộc, ngày hợp lệ", () => {
    expect(memorySchema.safeParse({ title: "  " }).success).toBe(false);
    const ok = memorySchema.parse({ title: "Bữa cơm", happenedOn: "2024-05-01", tags: "a, b" });
    expect(ok.tags).toEqual(["a", "b"]);
    expect(ok.visibility).toBe("family");
    expect(memorySchema.safeParse({ title: "x", happenedOn: "2024-13-45" }).success).toBe(false);
    expect(memorySchema.parse({ title: "x", happenedOn: "" }).happenedOn).toBeUndefined();
    expect(memorySchema.safeParse({ title: "x", visibility: "public" }).success).toBe(false);
    expect(memorySchema.safeParse({ title: "x", personIds: ["không-phải-uuid"] }).success).toBe(false);
  });
  it("mật khẩu & đăng ký", () => {
    expect(passwordSchema.safeParse("abc12").success).toBe(false);
    expect(passwordSchema.safeParse("chimnonhat").success).toBe(false);
    expect(passwordSchema.safeParse("matkhau123").success).toBe(true);
    expect(registerSchema.safeParse({ fullName: "An", email: "AN@Mail.com", password: "matkhau123" })).toMatchObject({ success: true, data: { email: "an@mail.com" } });
    expect(registerSchema.safeParse({ fullName: "", email: "x", password: "1" }).success).toBe(false);
  });
  it("lời mời: không cho mời làm chủ sở hữu", () => {
    expect(inviteSchema.safeParse({ email: "", role: "owner", days: 7 }).success).toBe(false);
    expect(inviteSchema.parse({ email: "", role: "viewer", days: "3" })).toMatchObject({ email: null, days: 3 });
    expect(inviteSchema.safeParse({ email: "a@b.vn", role: "admin", days: 99 }).success).toBe(false);
  });
  it("tệp tải lên: chỉ ảnh, giới hạn dung lượng", () => {
    const base = { path: "f/memories/m/x.jpg", mime: "image/jpeg", size: 1000, width: 10, height: 10 };
    expect(mediaMetaSchema.safeParse(base).success).toBe(true);
    expect(mediaMetaSchema.safeParse({ ...base, mime: "application/x-msdownload" }).success).toBe(false);
    expect(mediaMetaSchema.safeParse({ ...base, size: 30 * 1024 * 1024 }).success).toBe(false);
  });
});

describe("utils", () => {
  it("safeNext chặn chuyển hướng ra ngoài", () => {
    expect(safeNext("/family/memories")).toBe("/family/memories");
    expect(safeNext("https://evil.com")).toBe("/family");
    expect(safeNext("//evil.com")).toBe("/family");
    expect(safeNext("/\\evil.com")).toBe("/family");
    expect(safeNext(null)).toBe("/family");
  });
  it("định dạng ngày không lệch múi giờ", () => {
    expect(formatDate("2024-05-01")).toBe("1 tháng 5, 2024");
    expect(formatDate(null)).toBe("Chưa rõ ngày");
  });
  it("sanitizeSearch bỏ ký tự đặc biệt của bộ lọc", () => {
    expect(sanitizeSearch("a,b)(%*'\"")).toBe("a b");
    expect(sanitizeSearch("x".repeat(200))).toHaveLength(80);
  });
  it("initials, clampInt, randomToken", () => {
    expect(initials("Nguyễn Văn An")).toBe("NA");
    expect(initials("")).toBe("?");
    expect(clampInt("999", 1, 50, 12)).toBe(50);
    expect(clampInt("abc", 1, 50, 12)).toBe(12);
    expect(randomToken()).toMatch(/^[0-9a-f]{48}$/);
    expect(randomToken()).not.toBe(randomToken());
  });
});

describe("gia phả", () => {
  const ps = ["ong", "ba", "bo", "me", "con", "ban"].map((i) => person(i, i));
  const rels = [rel("ong", "bo"), rel("ba", "bo"), rel("bo", "con"), rel("me", "con"), rel("ba" < "ong" ? "ba" : "ong", "ba" < "ong" ? "ong" : "ba", "spouse"), rel("bo" < "me" ? "bo" : "me", "bo" < "me" ? "me" : "bo", "spouse")];
  it("phát hiện vòng lặp cha/mẹ - con", () => {
    expect(wouldCreateCycle(rels, "con", "ong")).toBe(true);
    expect(wouldCreateCycle(rels, "bo", "bo")).toBe(true);
    expect(wouldCreateCycle(rels, "ong", "ban")).toBe(false);
  });
  it("xếp thế hệ và vợ chồng cùng hàng", () => {
    const t = layoutTree(ps, rels);
    expect(t.generations.map((g) => g.people.map((n) => n.person.id).sort())).toEqual([["ba", "ong"], ["bo", "me"], ["con"]]);
    expect(t.orphans.map((p) => p.id)).toEqual(["ban"]);
  });
  it("mẹ chưa rõ cha mẹ vẫn xếp cùng thế hệ với chồng", () => {
    const t = layoutTree(ps, rels);
    expect(t.generations[1].people.map((n) => n.person.id).sort()).toEqual(["bo", "me"]);
  });
});

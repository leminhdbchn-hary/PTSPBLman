import { describe, expect, it } from "vitest";
import { inviteSchema, memorySchema, parseTags, passwordSchema, personSchema, registerSchema } from "../validation";
import { fold, formatDate, initials, randomToken, safeNext, sha256Hex } from "../utils";
import { layoutTree, relationshipProblem, wouldCreateCycle } from "../tree";
import { sortMemories } from "../data";
import type { Memory } from "../types";

const rel = (a: string, b: string, kind: "parent" | "spouse" = "parent") => ({ a, b, kind });
const person = (id: string, fullName: string) => ({ id, fullName });

describe("kiểm tra dữ liệu", () => {
  it("parseTags bỏ trùng, cắt gọn, tối đa 8 thẻ", () => {
    expect(parseTags(" Chuyến đi, chuyến đi ,,Sinh nhật ")).toEqual(["Chuyến đi", "Sinh nhật"]);
    expect(parseTags(Array.from({ length: 20 }, (_, i) => "t" + i).join(","))).toHaveLength(8);
    expect(parseTags("x".repeat(60))[0]).toHaveLength(24);
  });
  it("ký ức: tiêu đề bắt buộc, ngày hợp lệ, chế độ hiển thị hợp lệ, id người hợp lệ", () => {
    expect(memorySchema.safeParse({ title: "  " }).success).toBe(false);
    const ok = memorySchema.parse({ title: "Bữa cơm", happenedOn: "2024-05-01", tags: "a, b" });
    expect(ok).toMatchObject({ tags: ["a", "b"], visibility: "family", happenedOn: "2024-05-01", location: null });
    expect(memorySchema.parse({ title: "x", happenedOn: "" }).happenedOn).toBeNull();
    expect(memorySchema.safeParse({ title: "x", happenedOn: "2024-13-45" }).success).toBe(false);
    expect(memorySchema.safeParse({ title: "x", visibility: "public" }).success).toBe(false);
    expect(memorySchema.safeParse({ title: "x", personIds: ["../evil"] }).success).toBe(false);
  });
  it("mật khẩu, đăng ký, hồ sơ, lời mời", () => {
    expect(passwordSchema.safeParse("abc12").success).toBe(false);
    expect(passwordSchema.safeParse("chimnonhat").success).toBe(false);
    expect(passwordSchema.safeParse("matkhau123").success).toBe(true);
    expect(registerSchema.safeParse({ fullName: "A", email: "x@y", password: "matkhau123" }).success).toBe(false);
    expect(registerSchema.parse({ fullName: " An ", email: " AN@Example.com ", password: "matkhau123" }).email).toBe("an@example.com");
    expect(personSchema.parse({ fullName: "Ông", birthDate: "" }).birthDate).toBeNull();
    expect(inviteSchema.safeParse({ email: "", role: "owner", days: 7 }).success).toBe(false);
    expect(inviteSchema.parse({ email: "", role: "viewer", days: "3" })).toEqual({ email: null, role: "viewer", days: 3 });
    expect(inviteSchema.safeParse({ email: "", role: "viewer", days: 90 }).success).toBe(false);
  });
});

describe("tiện ích", () => {
  it("safeNext chặn chuyển hướng ra ngoài", () => {
    expect(safeNext("/family/memories")).toBe("/family/memories");
    for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", ""]) expect(safeNext(bad)).toBe("/family");
  });
  it("ngày, chữ cái đầu, bỏ dấu", () => {
    expect(formatDate("2024-05-01")).toBe("1 tháng 5, 2024");
    expect(formatDate(null)).toBe("Chưa rõ ngày");
    expect(initials("Nguyễn Văn An")).toBe("NA");
    expect(fold("Bữa cơm Đà Lạt")).toBe("bua com da lat");
  });
  it("mã mời đủ dài, ngẫu nhiên; băm SHA-256 ổn định", async () => {
    const a = randomToken(), b = randomToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("gia phả", () => {
  it("phát hiện vòng lặp", () => {
    const rs = [rel("ong", "bo"), rel("bo", "con")];
    expect(wouldCreateCycle(rs, "con", "ong")).toBe(true);
    expect(wouldCreateCycle(rs, "ong", "chau")).toBe(false);
    expect(wouldCreateCycle(rs, "x", "x")).toBe(true);
  });
  it("báo lỗi dễ hiểu cho quan hệ vô lý", () => {
    const rs = [rel("ong", "bo"), rel("ba", "bo"), rel("bo", "me", "spouse")];
    expect(relationshipProblem(rs, "a", "a", "parent")).toMatch(/khác nhau/);
    expect(relationshipProblem(rs, "ong", "bo", "parent")).toMatch(/đã có/);
    expect(relationshipProblem(rs, "x", "bo", "parent")).toMatch(/hai cha\/mẹ/);
    expect(relationshipProblem(rs, "me", "bo", "spouse")).toMatch(/đã có/);
    expect(relationshipProblem(rs, "ong", "bo", "spouse")).toMatch(/cha\/mẹ – con/);
    expect(relationshipProblem(rs, "ong", "ba", "spouse")).toBeNull();
  });
  it("xếp thế hệ, vợ chồng đứng cạnh nhau, người chưa nối ở riêng", () => {
    const people = ["ong", "ba", "bo", "me", "con", "le"].map((id) => person(id, id));
    const t = layoutTree(people, [rel("ong", "bo"), rel("ba", "bo"), rel("bo", "con"), rel("me", "con"), rel("ba", "ong", "spouse"), rel("bo", "me", "spouse")]);
    expect(t.generations.map((g) => g.people.map((n) => n.person.id))).toEqual([["ba", "ong"], ["bo", "me"], ["con"]]);
    expect(t.orphans.map((p) => p.id)).toEqual(["le"]);
  });
});

describe("sắp xếp ký ức", () => {
  it("mới nhất trước theo ngày xảy ra", () => {
    const m = (id: string, happenedOn: string | null) => ({ id, happenedOn, createdAt: null }) as unknown as Memory;
    expect(sortMemories([m("a", "2020-01-01"), m("b", "2024-05-01"), m("c", "2022-02-02")]).map((x) => x.id)).toEqual(["b", "c", "a"]);
  });
});

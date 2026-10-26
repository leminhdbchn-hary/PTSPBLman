// Kiểm thử luật bảo mật Firestore trên trình giả lập (không chạm dự án thật).
// Chạy: npm run test:rules
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import {
  collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch,
  type Firestore,
} from "firebase/firestore";
import * as D from "../src/lib/data";
import type { FamilyRole, Memory } from "../src/lib/types";
import { sha256Hex } from "../src/lib/utils";

let env: RulesTestEnvironment;
const users = {
  an: { uid: "an", name: "An Nguyễn", email: "an@example.com" },
  binh: { uid: "binh", name: "Bình Lê", email: "binh@example.com" },
  chi: { uid: "chi", name: "Chi Trần", email: "chi@example.com" },
  dung: { uid: "dung", name: "Dũng Phạm", email: "dung@example.com" },
  em: { uid: "em", name: "Em Võ", email: "em@example.com" },
};
type Who = keyof typeof users;
const dbCache = new Map<Who, Firestore>();
const db = (who: Who) => {
  if (!dbCache.has(who)) dbCache.set(who, env.authenticatedContext(users[who].uid, { email: users[who].email }).firestore() as unknown as Firestore);
  return dbCache.get(who)!;
};
const anon = () => env.unauthenticatedContext().firestore() as unknown as Firestore;
const ctx = (who: Who, fid: string, role: FamilyRole): D.Ctx => ({ db: db(who), user: users[who], fid, role });
const memoryInput = (title: string, visibility: "family" | "admins" | "private" = "family") => ({ title, body: "Nội dung", happenedOn: "2024-05-01", location: null, tags: ["Chuyến đi"], visibility, personIds: [] });
const tinyJpeg = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==";

let famA = "", famB = "";
const mem: Record<string, string> = {};

async function invite(from: Who, fid: string, role: FamilyRole, opts: { email?: string | null; days?: number } = {}) {
  const c = ctx(from, fid, from === "an" ? "owner" : "admin");
  return D.createInvite(c, "Nhà An", { email: opts.email ?? null, role: role as "viewer", days: opts.days ?? 7 });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-memo",
    firestore: { rules: readFileSync(process.env.RULES_FILE || "firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
  await env.clearFirestore();
});
afterAll(async () => { await env?.cleanup(); });

describe("tạo gia đình", () => {
  it("An tạo gia đình: là chủ sở hữu, có hồ sơ của mình", async () => {
    famA = await assertSucceeds(D.createFamily(db("an"), users.an, "Nhà An"));
    const m = await getDoc(doc(db("an"), "nn_families", famA, "members", "an"));
    expect(m.data()?.role).toBe("owner");
    expect((await D.listPeople(ctx("an", famA, "owner"))).map((p) => p.fullName)).toEqual(["An Nguyễn"]);
    famB = await D.createFamily(db("chi"), users.chi, "Nhà Chi");
  });
  it("không tạo được gia đình đứng tên người khác", async () => {
    const ref = doc(collection(db("em"), "nn_families"));
    const b = writeBatch(db("em"));
    b.set(ref, { name: "Giả", description: null, ownerId: "an", createdAt: serverTimestamp(), closing: false });
    b.set(doc(db("em"), "nn_families", ref.id, "members", "em"), { uid: "em", role: "owner", name: "Em", joinedAt: serverTimestamp() });
    await assertFails(b.commit());
  });
  it("không tự thêm mình làm chủ sở hữu của gia đình đã có", async () => {
    await assertFails(setDoc(doc(db("chi"), "nn_families", famA, "members", "chi"), { uid: "chi", role: "owner", name: "Chi", joinedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(db("chi"), "nn_families", famA, "members", "chi"), { uid: "chi", role: "viewer", name: "Chi", joinedAt: serverTimestamp() }));
  });
  it("không liệt kê được danh sách gia đình", async () => {
    await assertFails(getDocs(collection(db("chi"), "nn_families")));
  });
});

describe("cách ly giữa hai gia đình", () => {
  it("An viết 3 ký ức: cả nhà, quản trị, riêng tư", async () => {
    const c = ctx("an", famA, "owner");
    mem.family = await D.saveMemory(c, memoryInput("Bữa cơm chiều ngày mưa"));
    mem.admins = await D.saveMemory(c, memoryInput("Chuyện người lớn", "admins"));
    mem.private = await D.saveMemory(c, memoryInput("Nhật ký riêng của An", "private"));
    const pid = await D.addPhoto(c, mem.family, { data: tinyJpeg, w: 1, h: 1 });
    await D.setMemoryPhotos(c, mem.family, [pid], tinyJpeg);
    mem.photo = pid;
    mem.privPhoto = await D.addPhoto(c, mem.private, { data: tinyJpeg, w: 1, h: 1 });
    await D.setMemoryPhotos(c, mem.private, [mem.privPhoto], null);
  });
  it("Chi (gia đình khác) không đọc được gì của nhà An, kể cả khi biết ID", async () => {
    const d = db("chi");
    await assertFails(getDoc(doc(d, "nn_families", famA)));
    await assertFails(getDoc(doc(d, "nn_families", famA, "memories", mem.family)));
    await assertFails(getDocs(query(collection(d, "nn_families", famA, "memories"), where("visibility", "==", "family"))));
    await assertFails(getDocs(collection(d, "nn_families", famA, "members")));
    await assertFails(getDocs(collection(d, "nn_families", famA, "people")));
    await assertFails(getDoc(doc(d, "nn_families", famA, "photos", mem.photo)));
    await assertFails(getDocs(collection(d, "nn_families", famA, "memories", mem.family, "comments")));
    expect(await D.getMemory(ctx("chi", famA, "owner"), mem.family)).toBeNull();
  });
  it("Chi không ghi được vào nhà An (ký ức, bình luận, hồ sơ, sửa, xoá)", async () => {
    const d = db("chi");
    await assertFails(D.saveMemory(ctx("chi", famA, "owner"), memoryInput("chèn lậu")));
    await assertFails(setDoc(doc(d, "nn_families", famA, "memories", mem.family, "comments", "x"), { body: "hi", authorId: "chi", authorName: "Chi", createdAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(d, "nn_families", famA, "memories", mem.family), { title: "bị sửa" }));
    await assertFails(deleteDoc(doc(d, "nn_families", famA, "memories", mem.family)));
    await assertFails(updateDoc(doc(d, "nn_families", famA), { name: "Nhà Chi chiếm" }));
  });
  it("người chưa đăng nhập không đọc được gì", async () => {
    await assertFails(getDoc(doc(anon(), "nn_families", famA)));
    await assertFails(getDoc(doc(anon(), "nn_families", famA, "memories", mem.family)));
  });
  it("chỉ đọc được hồ sơ tài khoản của chính mình", async () => {
    await assertSucceeds(D.saveProfile(db("an"), users.an, "An Nguyễn", null));
    await assertFails(getDoc(doc(db("chi"), "nn_users", "an")));
  });
  it("tìm gia đình của tôi: chỉ thấy gia đình mình", async () => {
    expect((await D.listMyFamilies(db("chi"), "chi")).map((f) => f.name)).toEqual(["Nhà Chi"]);
    await assertFails(getDocs(query(collectionGroup(db("chi"), "members"), where("uid", "==", "an"))));
  });
});

describe("lời mời", () => {
  let binhLink = "";
  it("người chưa đăng nhập xem trước được lời mời khi có mã; DB chỉ lưu băm", async () => {
    const { token } = await invite("an", famA, "viewer");
    binhLink = token;
    const p = await D.previewInvite(anon(), famA, token);
    expect(p.ok && p.invite.familyName).toBe("Nhà An");
    await env.withSecurityRulesDisabled(async (c) => {
      const all = await getDocs(collection(c.firestore() as unknown as Firestore, "nn_families", famA, "invites"));
      expect(all.docs.every((d) => d.id.length === 64 && !JSON.stringify(d.data()).includes(token))).toBe(true);
    });
  });
  it("người ngoài không liệt kê được lời mời", async () => {
    await assertFails(getDocs(collection(db("chi"), "nn_families", famA, "invites")));
  });
  it("Bình nhận lời mời → chỉ xem; dùng lại lần hai bị từ chối", async () => {
    await assertSucceeds(D.acceptInvite(db("binh"), users.binh, famA, binhLink));
    expect((await getDoc(doc(db("an"), "nn_families", famA, "members", "binh"))).data()?.role).toBe("viewer");
    await expect(D.acceptInvite(db("em"), users.em, famA, binhLink)).rejects.toThrow(/đã được dùng/);
    // tấn công trực tiếp bằng batch, bỏ qua kiểm tra ở giao diện
    const h = await sha256Hex(binhLink);
    const b = writeBatch(db("em"));
    b.set(doc(db("em"), "nn_families", famA, "members", "em"), { uid: "em", role: "viewer", name: "Em", joinedAt: serverTimestamp(), invite: h });
    b.update(doc(db("em"), "nn_families", famA, "invites", h), { acceptedBy: "em", acceptedAt: serverTimestamp() });
    await assertFails(b.commit());
  });
  it("không nâng vai trò khi nhận lời mời (lời mời chỉ-xem nhưng xin làm quản trị)", async () => {
    const { token } = await invite("an", famA, "viewer");
    const h = await sha256Hex(token);
    const b = writeBatch(db("em"));
    b.set(doc(db("em"), "nn_families", famA, "members", "em"), { uid: "em", role: "admin", name: "Em", joinedAt: serverTimestamp(), invite: h });
    b.update(doc(db("em"), "nn_families", famA, "invites", h), { acceptedBy: "em", acceptedAt: serverTimestamp() });
    await assertFails(b.commit());
    await D.revokeInvite(ctx("an", famA, "owner"), h);
  });
  it("lời mời đã thu hồi, hết hạn, hoặc khoá theo email khác đều không dùng được", async () => {
    const r = await invite("an", famA, "viewer");
    await D.revokeInvite(ctx("an", famA, "owner"), await sha256Hex(r.token));
    await expect(D.acceptInvite(db("em"), users.em, famA, r.token)).rejects.toThrow(/thu hồi/);
    // hết hạn: tạo thẳng với hạn trong quá khứ
    const tok = "x".repeat(43), h = await sha256Hex(tok);
    await setDoc(doc(db("an"), "nn_families", famA, "invites", h), { familyId: famA, familyName: "Nhà An", role: "viewer", email: null, createdBy: "an", createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() - 1000), acceptedBy: null, acceptedAt: null, revoked: false });
    const b = writeBatch(db("em"));
    b.set(doc(db("em"), "nn_families", famA, "members", "em"), { uid: "em", role: "viewer", name: "Em", joinedAt: serverTimestamp(), invite: h });
    b.update(doc(db("em"), "nn_families", famA, "invites", h), { acceptedBy: "em", acceptedAt: serverTimestamp() });
    await assertFails(b.commit());
    const e = await invite("an", famA, "viewer", { email: "nguoikhac@example.com" });
    await expect(D.acceptInvite(db("em"), users.em, famA, e.token)).rejects.toThrow(/dành cho/);
  });
  it("lời mời không được hạn quá 30 ngày; người chỉ-xem không tạo được lời mời", async () => {
    await assertFails(setDoc(doc(db("an"), "nn_families", famA, "invites", "a".repeat(64)), { familyId: famA, familyName: "Nhà An", role: "viewer", email: null, createdBy: "an", createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 90 * 86400000), acceptedBy: null, acceptedAt: null, revoked: false }));
    await assertFails(setDoc(doc(db("binh"), "nn_families", famA, "invites", "c".repeat(64)), { familyId: famA, familyName: "Nhà An", role: "viewer", email: null, createdBy: "binh", createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 86400000), acceptedBy: null, acceptedAt: null, revoked: false }));
  });
});

describe("vai trò và chế độ hiển thị", () => {
  it("Bình (chỉ xem) chỉ thấy ký ức 'cả nhà'; không đọc được ký ức quản trị/riêng tư", async () => {
    const c = ctx("binh", famA, "viewer");
    expect((await D.listMemories(c)).map((m) => m.title)).toEqual(["Bữa cơm chiều ngày mưa"]);
    await assertFails(getDoc(doc(c.db, "nn_families", famA, "memories", mem.private)));
    await assertFails(getDoc(doc(c.db, "nn_families", famA, "memories", mem.admins)));
    await assertFails(getDocs(collection(c.db, "nn_families", famA, "memories"))); // truy vấn không lọc bị từ chối cả
  });
  it("ảnh đi theo quyền của ký ức", async () => {
    await assertSucceeds(getDoc(doc(db("binh"), "nn_families", famA, "photos", mem.photo)));
    await assertFails(getDoc(doc(db("binh"), "nn_families", famA, "photos", mem.privPhoto)));
    await assertFails(getDocs(collection(db("binh"), "nn_families", famA, "photos")));
  });
  it("người chỉ xem không thêm ký ức, nhưng bình luận được trên ký ức cả nhà", async () => {
    const c = ctx("binh", famA, "viewer");
    await assertFails(D.saveMemory({ ...c, role: "contributor" }, memoryInput("thử")));
    await assertSucceeds(D.addComment(c, mem.family, "Nhớ quá!"));
    await assertFails(D.addComment(c, mem.private, "lén"));
  });
  it("Bình không tự nâng vai trò", async () => {
    await assertFails(updateDoc(doc(db("binh"), "nn_families", famA, "members", "binh"), { role: "admin" }));
    await assertSucceeds(updateDoc(doc(db("binh"), "nn_families", famA, "members", "binh"), { name: "Bình Lê Văn" }));
  });
  it("An nâng Bình lên đóng góp → Bình thêm được ký ức; không sửa/xoá được ký ức của An", async () => {
    await D.setRole(ctx("an", famA, "owner"), "binh", "contributor");
    const c = ctx("binh", famA, "contributor");
    mem.binhPrivate = await assertSucceeds(D.saveMemory(c, memoryInput("Chuyến đi của Bình", "private")));
    await assertFails(updateDoc(doc(c.db, "nn_families", famA, "memories", mem.family), { title: "Bình sửa" }));
    await assertFails(deleteDoc(doc(c.db, "nn_families", famA, "memories", mem.family)));
    await assertFails(D.addPhoto(c, mem.family, { data: tinyJpeg, w: 1, h: 1 })); // gắn ảnh vào ký ức người khác
  });
  it("ký ức riêng tư của Bình: kể cả chủ sở hữu cũng không đọc/xoá được", async () => {
    await assertFails(getDoc(doc(db("an"), "nn_families", famA, "memories", mem.binhPrivate)));
    await assertFails(deleteDoc(doc(db("an"), "nn_families", famA, "memories", mem.binhPrivate)));
    expect((await D.listMemories(ctx("an", famA, "owner"))).map((m) => m.title)).not.toContain("Chuyến đi của Bình");
  });
  it("không giả danh người khác khi tạo ký ức hoặc bình luận", async () => {
    const d = db("binh");
    await assertFails(setDoc(doc(d, "nn_families", famA, "memories", "fake"), { title: "x", body: "", happenedOn: null, location: null, tags: [], visibility: "family", personIds: [], photoIds: [], cover: null, demoImages: [], createdBy: "an", createdByName: "An", createdAt: serverTimestamp(), updatedAt: serverTimestamp(), isDemo: false }));
    await assertFails(setDoc(doc(d, "nn_families", famA, "memories", mem.family, "comments", "fake"), { body: "x", authorId: "an", authorName: "An", createdAt: serverTimestamp() }));
  });
  it("dữ liệu ảnh phải là ảnh thật (data:image/…)", async () => {
    const c = ctx("an", famA, "owner");
    await assertFails(D.addPhoto(c, mem.family, { data: "javascript:alert(1)", w: 1, h: 1 }));
    await assertFails(D.addPhoto(c, mem.family, { data: "data:text/html;base64,PHNjcmlwdD4=", w: 1, h: 1 }));
  });
  it("quản trị viên sửa được ký ức của người khác nhưng không đổi chế độ hiển thị", async () => {
    const { token } = await invite("an", famA, "admin");
    await D.acceptInvite(db("dung"), users.dung, famA, token);
    const c = ctx("dung", famA, "admin");
    await assertSucceeds(updateDoc(doc(c.db, "nn_families", famA, "memories", mem.family), { title: "Bữa cơm chiều ngày mưa (sửa)" }));
    await assertFails(updateDoc(doc(c.db, "nn_families", famA, "memories", mem.family), { visibility: "private" }));
    await assertSucceeds(getDoc(doc(c.db, "nn_families", famA, "memories", mem.admins)));
  });
});

describe("quản trị viên & chủ sở hữu", () => {
  it("quản trị viên không đụng tới chủ sở hữu, không phong quản trị", async () => {
    const d = db("dung");
    await assertFails(updateDoc(doc(d, "nn_families", famA, "members", "an"), { role: "viewer" }));
    await assertFails(deleteDoc(doc(d, "nn_families", famA, "members", "an")));
    await assertFails(updateDoc(doc(d, "nn_families", famA, "members", "binh"), { role: "admin" }));
    await assertSucceeds(updateDoc(doc(d, "nn_families", famA, "members", "binh"), { role: "viewer" }));
    await assertSucceeds(updateDoc(doc(d, "nn_families", famA, "members", "binh"), { role: "contributor" }));
    await expect(D.createInvite(ctx("dung", famA, "admin"), "Nhà An", { email: null, role: "admin", days: 7 })).rejects.toThrow();
    await assertFails(setDoc(doc(d, "nn_families", famA, "invites", "b".repeat(64)), { familyId: famA, familyName: "Nhà An", role: "admin", email: null, createdBy: "dung", createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 86400000), acceptedBy: null, acceptedAt: null, revoked: false }));
  });
  it("chủ sở hữu không tự hạ vai trò khi chưa chuyển quyền; người khác không tự chiếm quyền chủ", async () => {
    await assertFails(updateDoc(doc(db("an"), "nn_families", famA, "members", "an"), { role: "admin" }));
    await assertFails(updateDoc(doc(db("dung"), "nn_families", famA), { ownerId: "dung" }));
    await assertFails(updateDoc(doc(db("binh"), "nn_families", famA), { closing: true }));
    await assertFails(D.deleteFamily(ctx("dung", famA, "owner")));
  });
  it("chuyển quyền chủ sở hữu An → Dũng", async () => {
    await assertSucceeds(D.transferOwnership(ctx("an", famA, "owner"), "dung"));
    const m = await getDocs(collection(db("dung"), "nn_families", famA, "members"));
    const roles = Object.fromEntries(m.docs.map((d) => [d.id, d.data().role]));
    expect(roles).toMatchObject({ an: "admin", dung: "owner", binh: "contributor" });
    await assertSucceeds(D.transferOwnership(ctx("dung", famA, "owner"), "an"));
  });
});

describe("hồ sơ, ngày sinh riêng tư, gia phả", () => {
  let ong = "", bo = "";
  it("ngày sinh để riêng tư không nằm trong hồ sơ công khai", async () => {
    const c = ctx("an", famA, "owner");
    ong = await D.savePerson(c, { fullName: "Ông Hải", relationLabel: "Ông nội", birthDate: "1940-03-02", birthDateVisible: false, bio: null });
    bo = await D.savePerson(c, { fullName: "Bố Minh", relationLabel: "Bố", birthDate: null, birthDateVisible: false, bio: null });
    const p = await D.getPerson(ctx("binh", famA, "contributor"), ong);
    expect(p?.birthDate).toBeNull();
    await assertFails(getDoc(doc(db("binh"), "nn_families", famA, "peoplePrivate", ong)));
    expect(await D.getPrivateBirthDate(c, ong)).toBe("1940-03-02");
    await assertFails(setDoc(doc(db("an"), "nn_families", famA, "people", "lo"), { fullName: "Lộ", relationLabel: null, birthDate: "2000-01-01", birthDateVisible: false, bio: null, avatar: null, userId: null, isDemo: false, createdBy: "an", createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  });
  it("quan hệ: không tự nối với mình, không trỏ tới người không có, chặn vòng lặp ở ứng dụng", async () => {
    const c = ctx("an", famA, "owner");
    await assertSucceeds(D.addRelationship(c, ong, bo, "parent"));
    await expect(D.addRelationship(c, bo, ong, "parent")).rejects.toThrow(/vòng lặp/);
    await assertFails(setDoc(doc(c.db, "nn_families", famA, "relationships", `parent_${ong}_${ong}`), { a: ong, b: ong, kind: "parent", createdBy: "an", createdAt: serverTimestamp(), isDemo: false }));
    await assertFails(setDoc(doc(c.db, "nn_families", famA, "relationships", `parent_${ong}_khong-co`), { a: ong, b: "khong-co", kind: "parent", createdBy: "an", createdAt: serverTimestamp(), isDemo: false }));
    await assertFails(setDoc(doc(c.db, "nn_families", famA, "relationships", "tuy-y"), { a: bo, b: ong, kind: "spouse", createdBy: "an", createdAt: serverTimestamp(), isDemo: false }));
    await assertFails(setDoc(doc(c.db, "nn_families", famA, "relationships", `parent_${ong}_${bo}`), { a: ong, b: bo, kind: "parent", createdBy: "an", createdAt: serverTimestamp(), isDemo: false })); // đã có → không ghi đè
  });
  it("người chỉ xem không sửa gia phả", async () => {
    await D.setRole(ctx("an", famA, "owner"), "binh", "viewer");
    const [x, y] = [bo, ong].sort();
    await assertFails(setDoc(doc(db("binh"), "nn_families", famA, "relationships", `spouse_${x}_${y}`), { a: x, b: y, kind: "spouse", createdBy: "binh", createdAt: serverTimestamp(), isDemo: false }));
    await D.setRole(ctx("an", famA, "owner"), "binh", "contributor");
  });
});

describe("sổ đăng ký id", () => {
  it("không ghi được đường dẫn trỏ sang gia đình khác; không đọc sổ của người khác", async () => {
    await assertFails(setDoc(doc(db("binh"), "nn_families", famA, "registry", "r1"), { kind: "memory", path: `nn_families/${famB}/memories/abc`, createdBy: "binh" }));
    await assertFails(getDocs(query(collection(db("binh"), "nn_families", famA, "registry"), where("createdBy", "==", "an"))));
    await assertSucceeds(getDocs(query(collection(db("binh"), "nn_families", famA, "registry"), where("createdBy", "==", "binh"))));
  });
});

describe("rời và xoá", () => {
  it("Bình rời gia đình: ký ức riêng tư của Bình bị xoá, không còn đọc được gì", async () => {
    await assertSucceeds(D.leaveFamily(ctx("binh", famA, "contributor")));
    await env.withSecurityRulesDisabled(async (c) => {
      expect((await getDoc(doc(c.firestore() as unknown as Firestore, "nn_families", famA, "memories", mem.binhPrivate))).exists()).toBe(false);
    });
    await assertFails(getDoc(doc(db("binh"), "nn_families", famA, "memories", mem.family)));
  });
  it("chủ sở hữu không rời được khi chưa chuyển quyền", async () => {
    await expect(D.leaveFamily(ctx("an", famA, "owner"))).rejects.toThrow(/chuyển quyền/);
  });
  it("xoá cả gia đình: sạch mọi tài liệu, kể cả ký ức riêng tư; gia đình khác còn nguyên", async () => {
    // Dũng viết một ký ức riêng tư mà An không đọc được, để kiểm tra dọn sạch
    const priv = await D.saveMemory(ctx("dung", famA, "admin"), memoryInput("Riêng của Dũng", "private"));
    await D.addPhoto(ctx("dung", famA, "admin"), priv, { data: tinyJpeg, w: 1, h: 1 });
    await assertSucceeds(D.deleteFamily(ctx("an", famA, "owner")));
    await env.withSecurityRulesDisabled(async (c) => {
      const f = c.firestore() as unknown as Firestore;
      for (const name of ["members", "memories", "photos", "people", "peoplePrivate", "relationships", "invites", "registry"]) {
        expect((await getDocs(collection(f, "nn_families", famA, name))).size, name).toBe(0);
      }
      expect((await getDocs(collection(f, "nn_families", famA, "memories", mem.family, "comments"))).size).toBe(0);
      expect((await getDoc(doc(f, "nn_families", famA))).exists()).toBe(false);
      expect((await getDoc(doc(f, "nn_families", famB))).exists()).toBe(true);
    });
  });
});

// Khi kiểm thử bản luật gộp để deploy chung dự án với site Phòng: luật cũ của site Phòng vẫn chạy như trước
describe.runIf(!!process.env.RULES_FILE)("luật gộp: site Phòng PTSPBL không bị ảnh hưởng", () => {
  it("chị em (không đăng nhập) vẫn ghi tiến độ, lời nhờ; trang quản lý vẫn đọc được", async () => {
    await assertSucceeds(setDoc(doc(anon(), "progress", "p1"), { name: "Hà", step: 3 }));
    await assertSucceeds(setDoc(doc(anon(), "requests", "r1"), { id: "r1", who: "Hà", text: "giúp", at: 1 }));
    await assertSucceeds(getDocs(collection(anon(), "progress")));
    await assertFails(deleteDoc(doc(anon(), "progress", "p1")));
    await assertSucceeds(setDoc(doc(anon(), "settings", "stock"), { qty: [1, 2], seed: 1, map: {}, at: 1 }));
    await assertFails(setDoc(doc(anon(), "settings", "khac"), { qty: [1] }));
  });
  it("site Phòng không đọc được dữ liệu Memo và ngược lại không mở thêm gì", async () => {
    await assertFails(getDocs(collection(anon(), "nn_families")));
    await assertFails(getDoc(doc(db("em"), "nn_users", "an")));
    await assertFails(setDoc(doc(db("em"), "bat_ky", "x"), { a: 1 }));
  });
});

// giữ kiểu Memory được dùng (tránh cảnh báo khi tái cấu trúc)
export type _M = Memory;

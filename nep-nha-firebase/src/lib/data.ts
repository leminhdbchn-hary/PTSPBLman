// Lớp dữ liệu: mọi thao tác Firestore của ứng dụng nằm ở đây.
// Quyền thật sự được kiểm tra bởi firestore.rules; các kiểm tra ở đây chỉ để báo lỗi sớm và dễ hiểu.
import {
  collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch,
  type DocumentData, type Firestore, type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { Comment, Family, FamilyRole, Invite, Member, Memory, MyFamily, Person, Photo, Relationship, Visibility } from "./types";
import type { MemoryInput, PersonInput } from "./validation";
import { randomToken, sha256Hex } from "./utils";
import { relationshipProblem } from "./tree";

export type User = { uid: string; name: string; email: string };
export type Ctx = { db: Firestore; user: User; fid: string; role: FamilyRole };
export const canWrite = (r: FamilyRole) => r !== "viewer";
export const isAdmin = (r: FamilyRole) => r === "owner" || r === "admin";

const F = "nn_families";
const fam = (db: Firestore, fid: string) => doc(db, F, fid);
const sub = (db: Firestore, fid: string, name: string) => collection(db, F, fid, name);
const withId = <T>(s: QueryDocumentSnapshot<DocumentData> | { id: string; data(): DocumentData | undefined }) => ({ id: s.id, ...(s.data() as object) }) as T;

/** Lỗi mang thông báo tiếng Việt để hiển thị thẳng cho người dùng. */
export class UserError extends Error {}

/** Đổi lỗi Firebase sang câu tiếng Việt, không lộ chi tiết kỹ thuật. */
export function friendlyError(e: unknown, fallback = "Có lỗi xảy ra, bạn thử lại sau nhé."): string {
  if (e instanceof UserError) return e.message;
  const code = (e as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "permission-denied": "Bạn không có quyền thực hiện thao tác này.",
    "unavailable": "Không kết nối được máy chủ. Bạn kiểm tra mạng rồi thử lại nhé.",
    "not-found": "Không tìm thấy dữ liệu.",
    "auth/invalid-credential": "Email hoặc mật khẩu chưa đúng.",
    "auth/wrong-password": "Email hoặc mật khẩu chưa đúng.",
    "auth/user-not-found": "Email hoặc mật khẩu chưa đúng.",
    "auth/invalid-email": "Email chưa đúng định dạng.",
    "auth/email-already-in-use": "Email này đã có tài khoản. Bạn thử đăng nhập nhé.",
    "auth/weak-password": "Mật khẩu quá yếu.",
    "auth/too-many-requests": "Bạn thử quá nhiều lần. Đợi vài phút rồi thử lại nhé.",
    "auth/network-request-failed": "Không kết nối được mạng. Bạn kiểm tra lại rồi thử nhé.",
    "auth/requires-recent-login": "Vì an toàn, bạn cần nhập lại mật khẩu để tiếp tục.",
    "auth/operation-not-allowed": "Đăng nhập bằng email chưa được bật cho dự án này.",
  };
  return map[code] ?? fallback;
}

// ============================== gia đình ==============================

export async function createFamily(db: Firestore, user: User, name: string, description: string | null = null): Promise<string> {
  const ref = doc(collection(db, F));
  const b = writeBatch(db);
  b.set(ref, { name, description, ownerId: user.uid, createdAt: serverTimestamp(), closing: false });
  b.set(doc(db, F, ref.id, "members", user.uid), { uid: user.uid, role: "owner", name: user.name, joinedAt: serverTimestamp() });
  await b.commit();
  await ensureSelfPerson(db, ref.id, user);
  return ref.id;
}

/** Mỗi thành viên có tài khoản có một hồ sơ trong gia phả (tạo một lần). */
export async function ensureSelfPerson(db: Firestore, fid: string, user: User) {
  const snap = await getDocs(query(sub(db, fid, "people"), where("userId", "==", user.uid)));
  if (!snap.empty) return;
  await setDoc(doc(sub(db, fid, "people")), {
    fullName: user.name, relationLabel: null, birthDate: null, birthDateVisible: false, bio: null, avatar: null,
    userId: user.uid, isDemo: false, createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}

export async function listMyFamilies(db: Firestore, uid: string): Promise<MyFamily[]> {
  const snap = await getDocs(query(collectionGroup(db, "members"), where("uid", "==", uid)));
  const out: MyFamily[] = [];
  for (const m of snap.docs) {
    const fid = m.ref.parent.parent?.id;
    if (!fid) continue;
    try {
      const f = await getDoc(fam(db, fid));
      if (f.exists() && !f.data().closing) out.push({ id: fid, name: String(f.data().name), role: m.data().role as FamilyRole });
    } catch { /* gia đình đang bị xoá */ }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export async function getFamily(db: Firestore, fid: string): Promise<Family | null> {
  const s = await getDoc(fam(db, fid));
  return s.exists() ? withId<Family>(s) : null;
}

export async function updateFamily(ctx: Ctx, name: string, description: string | null) {
  await updateDoc(fam(ctx.db, ctx.fid), { name, description });
}

export async function listMembers(ctx: Ctx): Promise<Member[]> {
  const s = await getDocs(sub(ctx.db, ctx.fid, "members"));
  const order: FamilyRole[] = ["owner", "admin", "contributor", "viewer"];
  return s.docs.map((d) => d.data() as Member).sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role) || a.name.localeCompare(b.name, "vi"));
}

export async function setRole(ctx: Ctx, uid: string, role: Exclude<FamilyRole, "owner">) {
  await updateDoc(doc(ctx.db, F, ctx.fid, "members", uid), { role });
}

export async function removeMember(ctx: Ctx, uid: string) {
  await deleteDoc(doc(ctx.db, F, ctx.fid, "members", uid));
}

export async function transferOwnership(ctx: Ctx, newOwner: string) {
  const b = writeBatch(ctx.db);
  b.update(fam(ctx.db, ctx.fid), { ownerId: newOwner });
  b.update(doc(ctx.db, F, ctx.fid, "members", newOwner), { role: "owner" });
  b.update(doc(ctx.db, F, ctx.fid, "members", ctx.user.uid), { role: "admin" });
  await b.commit();
}

/** Rời gia đình. Ký ức riêng tư của mình trong gia đình này bị xoá luôn (không ai khác đọc được chúng). */
export async function leaveFamily(ctx: Ctx) {
  if (ctx.role === "owner") throw new UserError("Chủ sở hữu cần chuyển quyền cho người khác trước khi rời gia đình (hoặc xoá cả gia đình).");
  const mine = await getDocs(query(sub(ctx.db, ctx.fid, "memories"), where("createdBy", "==", ctx.user.uid), where("visibility", "==", "private")));
  for (const m of mine.docs) await deleteMemory(ctx, withId<Memory>(m));
  await deleteDoc(doc(ctx.db, F, ctx.fid, "members", ctx.user.uid));
}

/** Xoá cả gia đình: khoá lại (không mở lại được), mời mọi người ra, rồi dọn sạch từng tài liệu. */
export async function deleteFamily(ctx: Ctx, onProgress?: (msg: string) => void) {
  if (ctx.role !== "owner") throw new UserError("Chỉ chủ sở hữu mới xoá được gia đình.");
  const { db, fid } = ctx;
  await updateDoc(fam(db, fid), { closing: true });
  const del = async (refs: { path: string }[]) => {
    for (let i = 0; i < refs.length; i += 200) {
      const b = writeBatch(db);
      for (const r of refs.slice(i, i + 200)) b.delete(doc(db, r.path));
      await b.commit();
    }
  };
  onProgress?.("Đang mời mọi người ra khỏi gia đình…");
  const members = await getDocs(sub(db, fid, "members"));
  await del(members.docs.filter((d) => d.id !== ctx.user.uid).map((d) => d.ref));
  onProgress?.("Đang xoá ký ức và ảnh…");
  const reg = await getDocs(sub(db, fid, "registry"));
  const paths = reg.docs.map((d) => String(d.data().path));
  // bình luận → ảnh → ký ức (thứ tự không quan trọng với quyền, chỉ để gọn)
  const rank = (p: string) => (p.includes("/comments/") ? 0 : p.includes("/photos/") ? 1 : 2);
  await del(paths.sort((a, b) => rank(a) - rank(b)).map((path) => ({ path })));
  await del(reg.docs.map((d) => d.ref));
  onProgress?.("Đang xoá hồ sơ, gia phả và lời mời…");
  const people = await getDocs(sub(db, fid, "people"));
  await del(people.docs.map((d) => ({ path: `${F}/${fid}/peoplePrivate/${d.id}` })));
  await del(people.docs.map((d) => d.ref));
  await del((await getDocs(sub(db, fid, "relationships"))).docs.map((d) => d.ref));
  await del((await getDocs(sub(db, fid, "invites"))).docs.map((d) => d.ref));
  await deleteDoc(doc(db, F, fid, "members", ctx.user.uid));
  await deleteDoc(fam(db, fid));
}

// ============================== lời mời ==============================

export async function createInvite(ctx: Ctx, familyName: string, input: { email: string | null; role: Exclude<FamilyRole, "owner">; days: number }) {
  if (!isAdmin(ctx.role)) throw new UserError("Chỉ quản trị viên mới mời được thành viên.");
  if (input.role === "admin" && ctx.role !== "owner") throw new UserError("Chỉ chủ sở hữu mới mời được quản trị viên.");
  const token = randomToken(32);
  const h = await sha256Hex(token);
  await setDoc(doc(ctx.db, F, ctx.fid, "invites", h), {
    familyId: ctx.fid, familyName, role: input.role, email: input.email, createdBy: ctx.user.uid, createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(Date.now() + input.days * 86_400_000), acceptedBy: null, acceptedAt: null, revoked: false,
  });
  // Mã gốc chỉ có trong liên kết, cơ sở dữ liệu chỉ giữ bản băm
  return { token, path: `/invite/${ctx.fid}/${token}` };
}

export async function listInvites(ctx: Ctx): Promise<Invite[]> {
  const s = await getDocs(sub(ctx.db, ctx.fid, "invites"));
  return s.docs.map((d) => withId<Invite>(d)).sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
}

export async function revokeInvite(ctx: Ctx, id: string) {
  await updateDoc(doc(ctx.db, F, ctx.fid, "invites", id), { revoked: true });
}

export type InvitePreview = { ok: true; invite: Invite; hash: string } | { ok: false; reason: string };
export async function previewInvite(db: Firestore, fid: string, token: string): Promise<InvitePreview> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(fid) || !/^[A-Za-z0-9_-]{30,64}$/.test(token)) return { ok: false, reason: "Liên kết mời không hợp lệ." };
  const h = await sha256Hex(token);
  const s = await getDoc(doc(db, F, fid, "invites", h)).catch(() => null);
  if (!s || !s.exists()) return { ok: false, reason: "Liên kết mời không hợp lệ." };
  const inv = withId<Invite>(s);
  if (inv.revoked) return { ok: false, reason: "Lời mời này đã bị thu hồi." };
  if (inv.acceptedBy) return { ok: false, reason: "Lời mời này đã được dùng. Mỗi liên kết chỉ dùng được một lần." };
  if (inv.expiresAt.toMillis() < Date.now()) return { ok: false, reason: "Lời mời này đã hết hạn. Bạn nhờ người mời tạo liên kết mới nhé." };
  return { ok: true, invite: inv, hash: h };
}

export async function acceptInvite(db: Firestore, user: User, fid: string, token: string): Promise<void> {
  const p = await previewInvite(db, fid, token);
  if (!p.ok) throw new UserError(p.reason);
  if (p.invite.email && p.invite.email !== user.email.toLowerCase()) throw new UserError(`Lời mời này dành cho ${p.invite.email}. Bạn đăng nhập đúng email đó nhé.`);
  const existing = await getDoc(doc(db, F, fid, "members", user.uid)).catch(() => null);
  if (existing?.exists()) throw new UserError("Bạn đã là thành viên của gia đình này.");
  const b = writeBatch(db);
  b.set(doc(db, F, fid, "members", user.uid), { uid: user.uid, role: p.invite.role, name: user.name, joinedAt: serverTimestamp(), invite: p.hash });
  b.update(doc(db, F, fid, "invites", p.hash), { acceptedBy: user.uid, acceptedAt: serverTimestamp() });
  await b.commit();
  await ensureSelfPerson(db, fid, user);
}

// ============================== ký ức ==============================

/**
 * Các ký ức người này được xem. Firestore không tự lọc theo quyền, nên gọi riêng từng nhóm khớp với luật:
 * cả nhà + của tôi + (quản trị) nhóm quản trị; gộp lại và sắp xếp ở máy.
 */
export async function listMemories(ctx: Ctx): Promise<Memory[]> {
  const c = sub(ctx.db, ctx.fid, "memories");
  const qs = [query(c, where("visibility", "==", "family")), query(c, where("createdBy", "==", ctx.user.uid))];
  if (isAdmin(ctx.role)) qs.push(query(c, where("visibility", "==", "admins")));
  const snaps = await Promise.all(qs.map((q) => getDocs(q)));
  const map = new Map<string, Memory>();
  for (const s of snaps) for (const d of s.docs) map.set(d.id, withId<Memory>(d));
  return sortMemories([...map.values()]);
}

/** Mới nhất trước theo ngày xảy ra; ký ức chưa rõ ngày xếp theo ngày ghi. */
export function sortMemories(list: Memory[]): Memory[] {
  const key = (m: Memory) => m.happenedOn ?? new Date(m.createdAt?.toMillis() ?? 0).toISOString().slice(0, 10);
  return list.sort((a, b) => key(b).localeCompare(key(a)) || (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
}

export async function getMemory(ctx: Ctx, id: string): Promise<Memory | null> {
  try {
    const s = await getDoc(doc(ctx.db, F, ctx.fid, "memories", id));
    return s.exists() ? withId<Memory>(s) : null;
  } catch (e) {
    if ((e as { code?: string }).code === "permission-denied") return null; // không có quyền thì coi như không tồn tại
    throw e;
  }
}

export async function getPhotos(ctx: Ctx, m: Memory): Promise<Photo[]> {
  const out: Photo[] = [];
  for (const id of m.photoIds) {
    const s = await getDoc(doc(ctx.db, F, ctx.fid, "photos", id)).catch(() => null);
    if (s?.exists()) out.push(withId<Photo>(s));
  }
  return out;
}

const reg = (ctx: Ctx, kind: "memory" | "photo" | "comment", path: string) =>
  [doc(sub(ctx.db, ctx.fid, "registry")), { kind, path, createdBy: ctx.user.uid }] as const;

/** Tạo hoặc sửa ký ức (chưa gồm ảnh). Trả về id. */
export async function saveMemory(ctx: Ctx, input: MemoryInput, existing?: Memory): Promise<string> {
  if (!canWrite(ctx.role)) throw new UserError("Bạn chỉ có quyền xem.");
  const data = {
    title: input.title, body: input.body, happenedOn: input.happenedOn, location: input.location, tags: input.tags,
    visibility: input.visibility, personIds: input.personIds,
  };
  if (existing) {
    const visibility = existing.createdBy === ctx.user.uid ? data.visibility : existing.visibility;
    await updateDoc(doc(ctx.db, F, ctx.fid, "memories", existing.id), { ...data, visibility, updatedAt: serverTimestamp() });
    return existing.id;
  }
  const ref = doc(sub(ctx.db, ctx.fid, "memories"));
  const b = writeBatch(ctx.db);
  b.set(ref, {
    ...data, photoIds: [], cover: null, demoImages: [], createdBy: ctx.user.uid, createdByName: ctx.user.name,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), isDemo: false,
  });
  b.set(...reg(ctx, "memory", ref.path));
  await b.commit();
  return ref.id;
}

/** Thêm một ảnh (đã nén) vào ký ức. */
export async function addPhoto(ctx: Ctx, memoryId: string, img: { data: string; w: number; h: number }): Promise<string> {
  const ref = doc(sub(ctx.db, ctx.fid, "photos"));
  const b = writeBatch(ctx.db);
  b.set(ref, { memoryId, data: img.data, w: img.w, h: img.h, createdBy: ctx.user.uid, createdAt: serverTimestamp() });
  b.set(...reg(ctx, "photo", ref.path));
  await b.commit();
  return ref.id;
}

export async function setMemoryPhotos(ctx: Ctx, memoryId: string, photoIds: string[], cover: string | null) {
  await updateDoc(doc(ctx.db, F, ctx.fid, "memories", memoryId), { photoIds, cover, updatedAt: serverTimestamp() });
}

export async function deletePhoto(ctx: Ctx, photoId: string) {
  await deleteDoc(doc(ctx.db, F, ctx.fid, "photos", photoId));
  await dropRegistry(ctx, `${F}/${ctx.fid}/photos/${photoId}`);
}

async function dropRegistry(ctx: Ctx, path: string) {
  try {
    const s = await getDocs(query(sub(ctx.db, ctx.fid, "registry"), where("createdBy", "==", ctx.user.uid), where("path", "==", path)));
    for (const d of s.docs) await deleteDoc(d.ref);
  } catch { /* chỉ là sổ đăng ký, không ảnh hưởng dữ liệu */ }
}

export async function deleteMemory(ctx: Ctx, m: Memory) {
  const { db, fid } = ctx;
  for (const pid of m.photoIds) await deleteDoc(doc(db, F, fid, "photos", pid)).catch(() => {});
  const comments = await getDocs(collection(db, F, fid, "memories", m.id, "comments")).catch(() => null);
  for (const c of comments?.docs ?? []) await deleteDoc(c.ref).catch(() => {});
  await deleteDoc(doc(db, F, fid, "memories", m.id));
  const mine = await getDocs(query(sub(db, fid, "registry"), where("createdBy", "==", ctx.user.uid))).catch(() => null);
  for (const r of mine?.docs ?? []) if (String(r.data().path).includes(m.id) || m.photoIds.some((p) => String(r.data().path).endsWith(p))) await deleteDoc(r.ref).catch(() => {});
}

export async function listComments(ctx: Ctx, memoryId: string): Promise<Comment[]> {
  const s = await getDocs(collection(ctx.db, F, ctx.fid, "memories", memoryId, "comments"));
  return s.docs.map((d) => withId<Comment>(d)).sort((a, b) => (a.createdAt?.toMillis() ?? Date.now()) - (b.createdAt?.toMillis() ?? Date.now()));
}

export async function addComment(ctx: Ctx, memoryId: string, body: string) {
  const ref = doc(collection(ctx.db, F, ctx.fid, "memories", memoryId, "comments"));
  const b = writeBatch(ctx.db);
  b.set(ref, { body, authorId: ctx.user.uid, authorName: ctx.user.name, createdAt: serverTimestamp() });
  b.set(...reg(ctx, "comment", ref.path));
  await b.commit();
}

export async function deleteComment(ctx: Ctx, memoryId: string, id: string) {
  await deleteDoc(doc(ctx.db, F, ctx.fid, "memories", memoryId, "comments", id));
  await dropRegistry(ctx, `${F}/${ctx.fid}/memories/${memoryId}/comments/${id}`);
}

// ============================== hồ sơ & gia phả ==============================

export async function listPeople(ctx: Ctx): Promise<Person[]> {
  const s = await getDocs(sub(ctx.db, ctx.fid, "people"));
  return s.docs.map((d) => withId<Person>(d)).sort((a, b) => a.fullName.localeCompare(b.fullName, "vi"));
}

export async function getPerson(ctx: Ctx, id: string): Promise<Person | null> {
  const s = await getDoc(doc(ctx.db, F, ctx.fid, "people", id)).catch(() => null);
  return s?.exists() ? withId<Person>(s) : null;
}

/** Ngày sinh riêng tư (null nếu không có hoặc không có quyền xem). */
export async function getPrivateBirthDate(ctx: Ctx, id: string): Promise<string | null> {
  try {
    const s = await getDoc(doc(ctx.db, F, ctx.fid, "peoplePrivate", id));
    return s.exists() ? (s.data().birthDate as string | null) : null;
  } catch {
    return null;
  }
}

export async function savePerson(ctx: Ctx, input: PersonInput & { avatar?: string | null }, existing?: Person): Promise<string> {
  const ref = existing ? doc(ctx.db, F, ctx.fid, "people", existing.id) : doc(sub(ctx.db, ctx.fid, "people"));
  const base = {
    fullName: input.fullName, relationLabel: input.relationLabel, bio: input.bio, birthDateVisible: input.birthDateVisible,
    birthDate: input.birthDateVisible ? input.birthDate : null,
    avatar: input.avatar === undefined ? existing?.avatar ?? null : input.avatar,
  };
  if (existing) await updateDoc(ref, { ...base, updatedAt: serverTimestamp() });
  else await setDoc(ref, { ...base, userId: null, isDemo: false, createdBy: ctx.user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  const priv = doc(ctx.db, F, ctx.fid, "peoplePrivate", ref.id);
  if (!input.birthDateVisible && input.birthDate) await setDoc(priv, { birthDate: input.birthDate });
  else if (existing) await deleteDoc(priv).catch(() => {});
  return ref.id;
}

export async function deletePerson(ctx: Ctx, p: Person) {
  const rels = await listRelationships(ctx);
  for (const r of rels.filter((r) => r.a === p.id || r.b === p.id)) await deleteDoc(doc(ctx.db, F, ctx.fid, "relationships", r.id));
  await deleteDoc(doc(ctx.db, F, ctx.fid, "peoplePrivate", p.id)).catch(() => {});
  await deleteDoc(doc(ctx.db, F, ctx.fid, "people", p.id));
}

export async function listRelationships(ctx: Ctx): Promise<Relationship[]> {
  const s = await getDocs(sub(ctx.db, ctx.fid, "relationships"));
  return s.docs.map((d) => withId<Relationship>(d));
}

export async function addRelationship(ctx: Ctx, a: string, b: string, kind: "parent" | "spouse", isDemo = false) {
  const rels = await listRelationships(ctx);
  const problem = relationshipProblem(rels, a, b, kind);
  if (problem) throw new UserError(problem);
  if (kind === "spouse" && a > b) [a, b] = [b, a];
  await setDoc(doc(ctx.db, F, ctx.fid, "relationships", `${kind}_${a}_${b}`), { a, b, kind, createdBy: ctx.user.uid, createdAt: serverTimestamp(), isDemo });
}

export async function deleteRelationship(ctx: Ctx, id: string) {
  await deleteDoc(doc(ctx.db, F, ctx.fid, "relationships", id));
}

// ============================== tài khoản ==============================

export async function saveProfile(db: Firestore, user: User, fullName: string, bio: string | null) {
  await setDoc(doc(db, "nn_users", user.uid), { fullName, bio, email: user.email, updatedAt: serverTimestamp() }, { merge: true });
  // cập nhật tên ở các gia đình mình tham gia (tên thành viên + hồ sơ gắn với tài khoản)
  const fams = await listMyFamilies(db, user.uid);
  for (const f of fams) {
    await updateDoc(doc(db, F, f.id, "members", user.uid), { name: fullName }).catch(() => {});
    const ps = await getDocs(query(sub(db, f.id, "people"), where("userId", "==", user.uid))).catch(() => null);
    for (const p of ps?.docs ?? []) await updateDoc(p.ref, { fullName, updatedAt: serverTimestamp() }).catch(() => {});
  }
}

/**
 * Dọn dữ liệu trước khi xoá tài khoản: xoá ký ức riêng tư của mình, rời các gia đình;
 * gia đình mà mình là chủ và là người duy nhất thì xoá luôn. Còn người khác thì phải chuyển quyền trước.
 */
export async function cleanupBeforeAccountDeletion(db: Firestore, user: User) {
  const fams = await listMyFamilies(db, user.uid);
  for (const f of fams) {
    if (f.role !== "owner") continue;
    const members = await getDocs(sub(db, f.id, "members"));
    if (members.size > 1) throw new UserError(`Bạn đang là chủ sở hữu “${f.name}”. Hãy chuyển quyền cho người khác trước khi xoá tài khoản.`);
  }
  for (const f of fams) {
    const ctx: Ctx = { db, user, fid: f.id, role: f.role };
    if (f.role === "owner") await deleteFamily(ctx);
    else await leaveFamily(ctx);
  }
  await deleteDoc(doc(db, "nn_users", user.uid)).catch(() => {});
}

// ============================== xuất dữ liệu ==============================

export async function exportFamily(ctx: Ctx, familyName: string) {
  const [memories, people, relationships, members] = await Promise.all([listMemories(ctx), listPeople(ctx), listRelationships(ctx), listMembers(ctx)]);
  const comments: Record<string, Comment[]> = {};
  for (const m of memories) comments[m.id] = await listComments(ctx, m.id).catch(() => []);
  const ts = (t: { toDate(): Date } | null | undefined) => (t ? t.toDate().toISOString() : null);
  return {
    exportedAt: new Date().toISOString(),
    note: "Dữ liệu bạn được quyền xem trong gia đình này. Ảnh gốc không nằm trong tệp; mở từng ký ức để lưu ảnh.",
    family: { id: ctx.fid, name: familyName },
    members: members.map((m) => ({ name: m.name, role: m.role, joinedAt: ts(m.joinedAt) })),
    people: people.map(({ avatar: _a, ...p }) => p),
    relationships: relationships.map(({ a, b, kind }) => ({ a, b, kind })),
    memories: memories.map(({ cover: _c, ...m }) => ({ ...m, createdAt: ts(m.createdAt), updatedAt: ts(m.updatedAt), photoCount: m.photoIds.length, comments: (comments[m.id] ?? []).map((c) => ({ author: c.authorName, body: c.body, at: ts(c.createdAt) })) })),
  };
}

export type { Visibility };

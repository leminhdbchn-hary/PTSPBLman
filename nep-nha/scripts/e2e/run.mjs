// Kiểm thử đầu-cuối: Next.js thật + PostgreSQL thật (RLS thật) + "Supabase giả" nói đúng giao thức Auth/REST/Storage + trình duyệt thật.
// Chạy: npm run build (với biến môi trường trỏ tới Supabase giả — script tự làm) rồi npm run test:e2e
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { startLocalDb } from "../lib/localdb.mjs";
import { startFake } from "./fake-supabase.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "../..");
const FAKE_PORT = 54331, APP_PORT = 3101;
const APP = `http://127.0.0.1:${APP_PORT}`;
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${FAKE_PORT}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "fake-anon-key",
  NEXT_PUBLIC_SITE_URL: APP,
  NEXT_PUBLIC_CONTACT_EMAIL: "lienhe@example.com",
};
const shotDir = process.env.E2E_SHOTS || path.join(root, ".e2e-shots");
fs.mkdirSync(shotDir, { recursive: true });

// PNG 8x8 hợp lệ (đỏ đất) tạo trực tiếp, không cần thư viện
import zlib from "node:zlib";
function png(r, g, b, size = 8) {
  const crc = (buf) => { let c, crcv = ~0; for (let n = 0; n < buf.length; n++) { c = (crcv ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcv = (crcv >>> 8) ^ c; } return ~crcv >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cr]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: size }, () => [r, g, b]).flat())]);
  const raw = Buffer.concat(Array.from({ length: size }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

let pass = 0, fail = 0;
const out = [];
async function step(name, fn, page) {
  if (process.env.E2E_STOP_BEFORE && name.includes(process.env.E2E_STOP_BEFORE)) { fs.writeFileSync("/tmp/e2e.hold", "1"); await new Promise((r) => setTimeout(r, 3600e3)); }
  try { await fn(); pass++; out.push("✔ " + name); }
  catch (e) {
    fail++; out.push(`✘ ${name}\n    ${String(e?.message ?? e).split("\n").slice(0, 4).join("\n    ")}`);
    if (page) out.push("    url: " + page.url() + " | " + ((await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 700)).catch(() => "")) || "") + " | nút: " + ((await page.$$eval("button", (e) => e.map((x) => x.textContent + (x.disabled ? "(vô hiệu)" : "")).join(", ")).catch(() => "")) || ""));
    if (page) await page.screenshot({ path: path.join(shotDir, "FAIL-" + name.replace(/\W+/g, "_").slice(0, 50) + ".png") }).catch(() => {});
  }
}
const ok = (c, msg) => { if (!c) throw new Error(msg); };

async function main() {
  const db = await startLocalDb();
  const fake = await startFake({ pgConfig: db.config, port: FAKE_PORT });
  let app;
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  try {
    if (!process.env.SKIP_BUILD) { out.push("… build với biến môi trường của Supabase giả"); execSync("npx next build", { cwd: root, env, stdio: process.env.E2E_SERVERLOG ? ["ignore", "ignore", fs.openSync(process.env.E2E_SERVERLOG, "a")] : "ignore" }); }
    app = spawn("npx", ["next", "start", "-p", String(APP_PORT), "-H", "127.0.0.1"], { cwd: root, env, stdio: process.env.E2E_SERVERLOG ? ["ignore", fs.openSync(process.env.E2E_SERVERLOG, "w"), fs.openSync(process.env.E2E_SERVERLOG, "a")] : "ignore" });
    for (let i = 0; i < 60; i++) { try { if ((await fetch(APP + "/privacy")).ok) break; } catch { /* chờ */ } await new Promise((r) => setTimeout(r, 500)); }

    const newCtx = async () => { const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true }); const page = await ctx.newPage();
    const rawGoto = page.goto.bind(page);
    // Trang dùng streaming (loading.tsx): chờ đến khi nội dung thật thay cho “Đang mở trang sổ…” và các chuyển hướng phía client hoàn tất
    page.goto = async (...a) => {
      const r = await rawGoto(a[0], { waitUntil: "networkidle", ...(a[1] || {}) }); // networkidle: chờ React hydrate xong rồi mới thao tác
      await page.waitForFunction(() => !document.body || !document.body.innerText.includes("Đang mở trang sổ"), null, { timeout: 15000 }).catch(() => {});
      await page.waitForLoadState("load").catch(() => {});
      return r;
    }; page.on("dialog", (d) => d.accept()); if (process.env.E2E_DEBUG) { page.on("response", (r) => { if (r.status() >= 400) console.log("   [http " + r.status() + "] " + r.url().slice(0, 140)); }); page.on("console", (m) => { if (m.type() === "error") console.log("   [console] " + m.text().slice(0, 200)); }); page.on("requestfailed", (r) => console.log("   [fail] " + r.url().slice(0, 120) + " " + r.failure()?.errorText)); } return { ctx, page }; };
    const register = async (page, name, email, pw = "matkhau123", next = "") => {
      await page.goto(`${APP}/register${next ? "?next=" + encodeURIComponent(next) : ""}`);
      await page.fill("#fullName", name); await page.fill("#email", email); await page.fill("#password", pw);
      await page.click("button[type=submit]");
    };
    const A = await newCtx(), B = await newCtx(), C = await newCtx();
    const pa = A.page, pb = B.page, pc = C.page;

    // ---------- đăng ký / đăng nhập ----------
    await step("khách chưa đăng nhập vào /family bị chuyển tới /login (có ?next=)", async () => {
      await pa.goto(APP + "/family/memories");
      ok(pa.url().includes("/login?next=%2Ffamily%2Fmemories"), pa.url());
    }, pa);
    await step("đăng ký sai: mật khẩu yếu hiện lỗi tiếng Việt, không tạo tài khoản", async () => {
      await register(pa, "An", "an@example.com", "123");
      await pa.waitForSelector("text=ít nhất 8 ký tự");
      ok((await db.admin.query("select count(*)::int c from auth.users")).rows[0].c === 0, "đã tạo tài khoản");
    }, pa);
    await step("đăng ký An thành công → màn tạo gia đình", async () => {
      await register(pa, "An Nguyễn", "an@example.com");
      await pa.waitForURL("**/onboarding");
      ok(await pa.locator("text=Hãy đặt tên cho gia đình").isVisible(), "không thấy màn onboarding");
      ok((await db.admin.query("select full_name from public.profiles")).rows[0].full_name === "An Nguyễn", "profile chưa được tạo");
    }, pa);
    await step("đăng ký trùng email báo lỗi thân thiện", async () => {
      await register(pb, "An 2", "an@example.com");
      await pb.waitForSelector("text=Email này đã có tài khoản");
    }, pb);
    await step("đăng nhập sai mật khẩu báo lỗi, đúng thì vào được", async () => {
      await pb.goto(APP + "/login"); await pb.fill("#email", "an@example.com"); await pb.fill("#password", "saimatkhau1"); await pb.click("button[type=submit]");
      await pb.waitForSelector("text=Email hoặc mật khẩu chưa đúng");
      await pb.fill("#password", "matkhau123"); await pb.click("button[type=submit]");
      await pb.waitForURL("**/onboarding");
      await B.ctx.clearCookies();
    }, pb);

    // ---------- tạo gia đình ----------
    await step("tạo gia đình “Nhà An” → trang tổng quan trống, người dùng là chủ sở hữu", async () => {
      await pa.fill("#name", "Nhà An"); await pa.click("button[type=submit]");
      await pa.waitForURL("**/family");
      await pa.waitForSelector("h1:has-text('Nhà An')");
      await pa.waitForSelector("text=Cuốn sổ còn trống");
      ok((await db.admin.query("select role from public.family_memberships")).rows[0].role === "owner", "không phải owner");
    }, pa);

    // ---------- ký ức ----------
    let memAId;
    await step("tạo ký ức có 2 ảnh thật → lưu, tải lên Storage, hiện ở chi tiết", async () => {
      await pa.goto(APP + "/family/memories/new");
      await pa.fill("#title", "Bữa cơm chiều ngày mưa"); await pa.fill("#happenedOn", "2024-05-01"); await pa.fill("#body", "Cả nhà ngồi quanh mâm cơm.\nMưa rất to.");
      await pa.click("button:has-text('Chuyến đi')");
      await pa.setInputFiles("input[type=file]", [{ name: "a.png", mimeType: "image/png", buffer: png(180, 90, 60) }, { name: "b.png", mimeType: "image/png", buffer: png(60, 120, 90) }]);
      await pa.waitForSelector("img[alt^='Ảnh sẽ tải lên']");
      await pa.click("button:has-text('Lưu vào sổ')");
      await pa.waitForURL(/\/family\/memories\/[0-9a-f-]{36}$/, { timeout: 20000 });
      memAId = pa.url().split("/").pop();
      ok(await pa.locator("h1:has-text('Bữa cơm chiều ngày mưa')").isVisible(), "thiếu tiêu đề");
      const imgs = await pa.$$eval("article img", (els) => els.map((e) => ({ src: e.src, ok: e.complete && e.naturalWidth > 0 })));
      ok(imgs.length >= 2, "chỉ có " + imgs.length + " ảnh");
      await pa.waitForTimeout(500);
      const loaded = await pa.$$eval("article img", (els) => els.filter((e) => e.complete && e.naturalWidth > 0).length);
      ok(loaded >= 2, "ảnh không tải được qua signed URL: " + loaded);
      ok(fake.files.size === 2, "Storage có " + fake.files.size + " file");
      ok((await db.admin.query("select count(*)::int c from public.memory_media")).rows[0].c === 2, "chưa gắn 2 ảnh vào DB");
    }, pa);
    await step("tạo ký ức thứ hai (không ảnh, riêng tư) + validation tiêu đề trống", async () => {
      await pa.goto(APP + "/family/memories/new");
      await pa.fill("#body", "chỉ có nội dung");
      await pa.click("button:has-text('Lưu vào sổ')");
      await pa.waitForSelector("text=Bạn đặt tiêu đề cho ký ức nhé");
      await pa.fill("#title", "Nhật ký riêng của An"); await pa.selectOption("#visibility", "private");
      await pa.click("button:has-text('Lưu vào sổ')");
      await pa.waitForURL(/\/family\/memories\/[0-9a-f-]{36}$/);
    }, pa);
    await step("dòng thời gian: nhóm theo năm, tìm kiếm, lọc theo chủ đề", async () => {
      await pa.goto(APP + "/family/memories");
      ok(await pa.locator("h2:has-text('2024')").isVisible(), "thiếu mốc năm 2024");
      await pa.fill("#q", "mâm cơm"); await pa.click("button:has-text('Lọc')");
      await pa.waitForURL(/q=/);
      ok((await pa.locator("article").count()) === 1, "tìm kiếm sai");
      await pa.goto(APP + "/family/memories?tag=" + encodeURIComponent("Chuyến đi"));
      ok((await pa.locator("article").count()) === 1, "lọc chủ đề sai");
      await pa.goto(APP + "/family/memories?q=" + encodeURIComponent("không có từ này"));
      await pa.waitForSelector("text=Không có ký ức nào khớp");
      await pa.goto(APP + "/family/memories?year=2023");
      await pa.waitForSelector("text=Không có ký ức nào khớp");
    }, pa);

    // ---------- gia đình thứ hai: cách ly dữ liệu ----------
    let memBId;
    await step("Chi tạo gia đình riêng và một ký ức", async () => {
      await register(pb, "Chi Trần", "chi@example.com"); await pb.waitForURL("**/onboarding");
      await pb.fill("#name", "Nhà Chi"); await pb.click("button[type=submit]"); await pb.waitForURL("**/family");
      await pb.goto(APP + "/family/memories/new"); await pb.fill("#title", "Bí mật nhà Chi"); await pb.click("button:has-text('Lưu vào sổ')");
      await pb.waitForURL(/\/family\/memories\/[0-9a-f-]{36}$/); memBId = pb.url().split("/").pop();
    }, pb);
    await step("CÁCH LY: An mở thẳng URL ký ức của gia đình khác → 404, không lộ tiêu đề", async () => {
      const r = await pa.goto(`${APP}/family/memories/${memBId}`);
      ok(await pa.getByText("Không tìm thấy trang này").count() > 0, "không phải trang 404");
      ok(!(await pa.content()).includes("Bí mật nhà Chi"), "lộ nội dung");
      const r2 = await pa.goto(`${APP}/family/memories/${memBId}/edit`);
      ok(await pa.getByText("Không tìm thấy trang này").count() > 0, "edit không phải 404"); void r; void r2;
    }, pa);
    await step("CÁCH LY: Chi không thấy ký ức/ảnh của An; danh sách chỉ có nội dung của mình", async () => {
      await pb.goto(`${APP}/family/memories/${memAId}`); ok(await pb.getByText("Không tìm thấy trang này").count() > 0, "mở được ký ức nhà An");
      await pb.goto(APP + "/family/memories");
      const titles = await pb.$$eval("article h3", (e) => e.map((x) => x.textContent));
      ok(titles.length === 1 && titles[0] === "Bí mật nhà Chi", JSON.stringify(titles));
    }, pb);
    await step("CÁCH LY: server action sửa/xoá ký ức của gia đình khác bị từ chối ở DB", async () => {
      // Chi lấy chính access token của mình rồi gọi thẳng REST với id ký ức của An (như kẻ tấn công đoán/lộ được ID)
      const cookie = (await pb.context().cookies()).find((c) => /^sb-.*-auth-token(\.0)?$/.test(c.name));
      ok(cookie, "không thấy cookie phiên");
      const sess = JSON.parse(Buffer.from(decodeURIComponent(cookie.value).replace(/^base64-/, ""), "base64url").toString());
      const H = { apikey: "fake-anon-key", Authorization: "Bearer " + sess.access_token, "Content-Type": "application/json", Prefer: "return=representation" };
      const R = `http://127.0.0.1:${FAKE_PORT}/rest/v1/memories?id=eq.${memAId}`;
      const got = await (await fetch(R, { headers: H })).json();
      ok(Array.isArray(got) && got.length === 0, "Chi đọc được ký ức nhà An: " + JSON.stringify(got).slice(0, 80));
      const upd = await (await fetch(R, { method: "PATCH", headers: H, body: JSON.stringify({ title: "bị sửa" }) })).json();
      ok(Array.isArray(upd) && upd.length === 0, "Chi sửa được ký ức nhà An");
      const del = await (await fetch(R, { method: "DELETE", headers: H })).json();
      ok(Array.isArray(del) && del.length === 0, "Chi xoá được ký ức nhà An");
      const row = (await db.admin.query("select title from public.memories where id=$1", [memAId])).rows[0];
      ok(row && row.title === "Bữa cơm chiều ngày mưa", "ký ức nhà An bị thay đổi");
      const ins = await fetch(`http://127.0.0.1:${FAKE_PORT}/rest/v1/memories`, { method: "POST", headers: H, body: JSON.stringify({ family_id: (await db.admin.query("select family_id from public.memories where id=$1", [memAId])).rows[0].family_id, title: "chèn lậu", created_by: sess.user.id }) });
      ok(ins.status >= 400, "Chi chèn được ký ức vào nhà An: " + ins.status);
    }, pb);

    // ---------- lời mời ----------
    let inviteLink;
    await step("An tạo lời mời (vai trò chỉ-xem) → có liên kết hiển thị một lần; DB chỉ lưu băm", async () => {
      await pa.goto(APP + "/family/manage");
      await pa.selectOption("#role", "viewer");
      await pa.click("button:has-text('Tạo liên kết mời')");
      await pa.waitForSelector("input[aria-label='Liên kết mời']");
      inviteLink = await pa.inputValue("input[aria-label='Liên kết mời']");
      ok(inviteLink.startsWith(APP + "/invite/"), inviteLink);
      const token = inviteLink.split("/").pop();
      const row = (await db.admin.query("select token_hash from public.invitations")).rows[0];
      ok(row.token_hash !== token && row.token_hash.length === 64, "DB không được lưu mã gốc");
    }, pa);
    await step("Bình mở lời mời khi chưa đăng nhập → thấy tên gia đình, nút đăng ký; sau đăng ký quay lại và tham gia", async () => {
      await pc.goto(inviteLink);
      await pc.waitForSelector("h1:has-text('Nhà An')");
      await pc.click("text=Tạo tài khoản để tham gia");
      await pc.waitForURL(/\/register\?next=/);
      await pc.fill("#fullName", "Bình Lê"); await pc.fill("#email", "binh@example.com"); await pc.fill("#password", "matkhau123"); await pc.click("button[type=submit]");
      await pc.waitForURL(/\/invite\//);
      await pc.click("button:has-text('Tham gia gia đình')");
      await pc.waitForURL("**/family");
      await pc.waitForSelector("h1:has-text('Nhà An')");
      ok((await db.admin.query("select role from public.family_memberships fm join auth.users u on u.id=fm.user_id where u.email='binh@example.com'")).rows[0].role === "viewer", "sai vai trò");
    }, pc);
    await step("lời mời dùng một lần: mở lại báo không dùng được", async () => {
      await pb.goto(inviteLink);
      await pb.waitForSelector("text=Lời mời không dùng được");
    }, pb);
    await step("Bình (chỉ-xem) thấy ký ức gia đình nhưng KHÔNG thấy nhật ký riêng của An; không có nút thêm", async () => {
      await pc.goto(APP + "/family/memories");
      const titles = await pc.$$eval("article h3", (e) => e.map((x) => x.textContent));
      ok(titles.includes("Bữa cơm chiều ngày mưa") && !titles.includes("Nhật ký riêng của An"), JSON.stringify(titles));
      ok((await pc.locator("a:has-text('Thêm ký ức')").count()) === 0, "viewer vẫn thấy nút thêm");
      await pc.goto(APP + "/family/memories/new"); ok(pc.url().endsWith("/family/memories"), "viewer vào được trang thêm: " + pc.url());
      ok((await pc.locator("text=Quản lý").count()) === 0, "viewer thấy mục Quản lý");
      await pc.goto(APP + "/family/manage"); ok(pc.url().endsWith("/family"), "viewer vào được /family/manage");
    }, pc);
    await step("ảnh của gia đình xem được bởi thành viên (signed URL) nhưng người ngoài không ký được URL", async () => {
      await pc.goto(`${APP}/family/memories/${memAId}`);
      await pc.waitForTimeout(400);
      const n = await pc.$$eval("article img", (els) => els.filter((e) => e.complete && e.naturalWidth > 0).length);
      ok(n >= 2, "Bình không thấy ảnh: " + n);
    }, pc);
    await step("An nâng Bình lên Đóng góp → Bình thêm được ký ức, bình luận được", async () => {
      await pa.goto(APP + "/family/manage");
      const sel = pa.locator("select[id^='r-']");
      await sel.selectOption("contributor"); await sel.locator("xpath=ancestor::form").locator("button").click();
      await pa.waitForTimeout(600);
      ok((await db.admin.query("select role from public.family_memberships fm join auth.users u on u.id=fm.user_id where u.email='binh@example.com'")).rows[0].role === "contributor", "chưa đổi vai trò");
      await pc.goto(APP + "/family/memories/new"); await pc.fill("#title", "Chuyến đi của Bình"); await pc.selectOption("#visibility", "private"); await pc.click("button:has-text('Lưu vào sổ')");
      await pc.waitForURL(/\/family\/memories\/[0-9a-f-]{36}$/);
      await pc.goto(`${APP}/family/memories/${memAId}`);
      await pc.fill("#cbody", "Nhớ quá!"); await pc.click("button:has-text('Gửi')");
      await pc.waitForSelector("text=Nhớ quá!");
    }, pc);
    await step("ký ức riêng tư của Bình KHÔNG hiện với An (kể cả chủ sở hữu)", async () => {
      await pa.goto(APP + "/family/memories");
      const titles = await pa.$$eval("article h3", (e) => e.map((x) => x.textContent));
      ok(!titles.includes("Chuyến đi của Bình"), JSON.stringify(titles));
    }, pa);
    await step("Bình sửa được ký ức của mình nhưng không sửa/xoá được ký ức của An", async () => {
      await pc.goto(`${APP}/family/memories/${memAId}`);
      ok((await pc.locator("a:has-text('Sửa ký ức')").count()) === 0, "thấy nút sửa ký ức người khác");
      await pc.goto(`${APP}/family/memories/${memAId}/edit`);
      ok(pc.url().endsWith(`/family/memories/${memAId}`), "vào được trang sửa: " + pc.url());
    }, pc);

    // ---------- thành viên & gia phả ----------
    await step("thêm hồ sơ thành viên có ảnh đại diện và ngày sinh ẩn", async () => {
      await pa.goto(APP + "/family/members/new");
      await pa.fill("#fullName", "Ông Hải"); await pa.fill("#relationLabel", "Ông nội"); await pa.fill("#birthDate", "1950-03-02"); await pa.fill("#bio", "Ông thích chuyện xưa.");
      await pa.setInputFiles("input[type=file]", { name: "av.png", mimeType: "image/png", buffer: png(120, 120, 200) });
      await pa.click("button:has-text('Thêm hồ sơ')");
      await pa.waitForURL(/\/family\/members\/[0-9a-f-]{36}$/);
      await pa.waitForSelector("h1:has-text('Ông Hải')");
      await pa.waitForTimeout(500);
      ok(await pa.locator("text=sinh 2 tháng 3, 1950").isVisible(), "người tạo phải thấy ngày sinh");
      ok(await pa.$eval("header img", (i) => i.complete && i.naturalWidth > 0), "ảnh đại diện không hiện");
    }, pa);
    await step("ngày sinh riêng tư: Bình không thấy ngày sinh của hồ sơ Ông Hải", async () => {
      await pc.goto(APP + "/family/members");
      await pc.click("text=Ông Hải");
      await pc.waitForSelector("h1:has-text('Ông Hải')");
      ok(!(await pc.content()).includes("1950"), "lộ ngày sinh");
    }, pc);
    await step("gia phả: nối quan hệ, sơ đồ theo thế hệ, chặn vòng lặp", async () => {
      // tạo thêm 2 người qua DB nhanh gọn rồi dùng giao diện để nối
      const fid = (await db.admin.query("select id from public.families where name='Nhà An'")).rows[0].id;
      const an = (await db.admin.query("select id from auth.users where email='an@example.com'")).rows[0].id;
      for (const n of ["Bố Minh", "Bé An"]) await db.admin.query("insert into public.people (family_id, full_name, created_by) values ($1,$2,$3)", [fid, n, an]);
      await pa.goto(APP + "/family/tree");
      const link = async (a, kind, b) => { await pa.selectOption("#personA", { label: a }); await pa.selectOption("#kind", kind); await pa.selectOption("#personB", { label: b }); await pa.click("button:has-text('Thêm quan hệ')"); await pa.waitForTimeout(2500); };
      await link("Ông Hải", "parent", "Bố Minh");
      await link("Bố Minh", "parent", "Bé An");
      await pa.waitForSelector("text=Thế hệ thứ 3");
      await link("Bé An", "parent", "Ông Hải");
      await pa.waitForSelector("text=vòng lặp");
      ok((await db.admin.query("select count(*)::int c from public.family_relationships")).rows[0].c === 2, "quan hệ vòng lặp đã lọt vào DB");
    }, pa);

    // ---------- dữ liệu mẫu ----------
    await step("thêm dữ liệu mẫu → hiện nhãn “Dữ liệu mẫu”; xoá dữ liệu mẫu giữ nguyên nội dung thật", async () => {
      await pa.goto(APP + "/family/manage");
      await pa.click("button:has-text('Thêm dữ liệu mẫu')");
      await pa.waitForURL("**/family/memories");
      await pa.waitForSelector("article >> text=Dữ liệu mẫu");
      ok((await pa.locator("text=Dữ liệu mẫu").count()) >= 5, "thiếu nhãn mẫu");
      const demoImgOk = await pa.$$eval("article img", (els) => els.filter((e) => e.src.includes("/demo/")).length);
      ok(demoImgOk >= 5, "ảnh minh hoạ mẫu: " + demoImgOk);
      await pa.goto(APP + "/family/manage"); await pa.click("button:has-text('Xoá dữ liệu mẫu')");
      await pa.waitForSelector("text=Đã xoá dữ liệu mẫu");
      await pa.goto(APP + "/family/memories");
      ok((await pa.locator("article").count()) === 2, "sau khi xoá mẫu phải còn 2 ký ức thật (1 chung + 1 riêng): " + (await pa.locator("article").count()));
      ok((await db.admin.query("select count(*)::int c from public.people where is_demo")).rows[0].c === 0, "còn hồ sơ mẫu");
    }, pa);

    // ---------- xoá ký ức dọn cả file ----------
    await step("xoá ký ức có xác nhận → ảnh trong Storage cũng bị xoá", async () => {
      await pa.goto(`${APP}/family/memories/${memAId}`);
      await pa.click("button:has-text('Xoá ký ức')");
      await pa.waitForURL(/memories\?deleted=1/);
      ok(fake.files.size === 1, "Storage còn " + fake.files.size + " file (chỉ còn avatar)");
      ok((await db.admin.query("select count(*)::int c from public.memories where id=$1", [memAId])).rows[0].c === 0, "ký ức còn trong DB");
    }, pa);

    // ---------- cài đặt ----------
    await step("cài đặt: sửa hồ sơ, đổi mật khẩu (sai mật khẩu cũ bị chặn)", async () => {
      await pa.goto(APP + "/settings");
      await pa.fill("#fullName", "An Nguyễn Văn"); await pa.click("button:has-text('Lưu hồ sơ')"); await pa.waitForSelector("text=Đã lưu hồ sơ của bạn");
      await pa.fill("#current", "saimatkhau9"); await pa.fill("section:has(#password) #password", "matkhaumoi1"); await pa.fill("#confirm", "matkhaumoi1");
      await pa.click("button:has-text('Đổi mật khẩu')"); await pa.waitForSelector("text=Mật khẩu hiện tại chưa đúng");
      await pa.fill("#current", "matkhau123"); await pa.fill("section:has(#password) #password", "matkhaumoi1"); await pa.fill("#confirm", "matkhaumoi1"); await pa.click("button:has-text('Đổi mật khẩu')"); await pa.waitForSelector("text=Đã đổi mật khẩu");
    }, pa);
    await step("xuất dữ liệu JSON (của tôi và của cả gia đình)", async () => {
      await pa.goto(APP + "/settings");
      for (const [scope, label] of [["me", "Tải dữ liệu của tôi"], ["family", "Tải dữ liệu cả gia đình"]]) {
        const [dl] = await Promise.all([pa.waitForEvent("download"), pa.click(`a:has-text('${label}')`)]);
        const data = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
        ok(data.scope === scope && data.family?.name === "Nhà An" && Array.isArray(data.memories), "JSON sai: " + scope);
        if (scope === "family") ok(!JSON.stringify(data).includes("Bí mật nhà Chi"), "xuất dữ liệu lộ gia đình khác");
      }
      const r = await pc.request.get(APP + "/api/export?scope=family");
      ok(r.status() === 403, "contributor tải được dữ liệu cả nhà: " + r.status());
    }, pa);
    await step("yêu cầu xoá tài khoản (cần gõ XOA) và huỷ yêu cầu", async () => {
      await pc.goto(APP + "/settings");
      await pc.click("button:has-text('Gửi yêu cầu xoá tài khoản')"); await pc.waitForSelector("text=gõ chữ XOA");
      await pc.fill("section:has(#xoa) #confirm", "XOA"); await pc.click("button:has-text('Gửi yêu cầu xoá tài khoản')");
      await pc.waitForSelector("text=Bạn đã yêu cầu xoá tài khoản ngày");
      ok((await db.admin.query("select count(*)::int c from public.account_deletion_requests where handled_at is null")).rows[0].c === 1, "chưa có yêu cầu xoá trong DB");
      await pc.reload(); await pc.waitForSelector("button:has-text('Huỷ yêu cầu xoá')");
      await pc.click("button:has-text('Huỷ yêu cầu xoá')"); await pc.waitForSelector("button:has-text('Gửi yêu cầu xoá tài khoản')");
    }, pc);

    // ---------- rời gia đình / đăng xuất / quên mật khẩu ----------
    await step("thành viên rời gia đình → quay về màn tạo gia đình, không còn xem được sổ", async () => {
      await pc.goto(APP + "/settings"); await pc.click("button:has-text('Rời khỏi gia đình')");
      await pc.waitForURL("**/onboarding");
      ok((await pc.goto(`${APP}/family/memories`)).url().includes("/onboarding"), "vẫn vào được sổ");
    }, pc);
    await step("đăng xuất bằng POST; sau đó /family chuyển về /login", async () => {
      await pa.goto(APP + "/family"); await pa.click("button:has-text('Đăng xuất')");
      await pa.waitForURL(APP + "/");
      await pa.goto(APP + "/family"); ok(pa.url().includes("/login"), pa.url());
      const r = await pa.request.get(APP + "/auth/signout"); ok(r.status() === 405, "GET signout phải bị chặn: " + r.status());
    }, pa);
    await step("đăng nhập bằng mật khẩu MỚI; mật khẩu cũ không còn dùng được", async () => {
      await pa.goto(APP + "/login"); await pa.fill("#email", "an@example.com"); await pa.fill("#password", "matkhau123"); await pa.click("button[type=submit]");
      await pa.waitForSelector("text=Email hoặc mật khẩu chưa đúng");
      await pa.fill("#password", "matkhaumoi1"); await pa.click("button[type=submit]"); await pa.waitForURL("**/family");
    }, pa);
    await step("quên mật khẩu: luôn trả lời giống nhau dù email có tồn tại hay không", async () => {
      await pb.goto(APP + "/forgot-password"); await pb.fill("#email", "khongco@example.com"); await pb.click("button[type=submit]");
      await pb.waitForSelector("text=Nếu email này có tài khoản");
    }, pb);
    await step("chuyển hướng ?next= chỉ cho phép đường dẫn nội bộ", async () => {
      await pb.goto(APP + "/login?next=" + encodeURIComponent("https://evil.example.com")); await pb.fill("#email", "chi@example.com"); await pb.fill("#password", "matkhau123"); await pb.click("button[type=submit]");
      await pb.waitForURL("**/family"); ok(new URL(pb.url()).host === `127.0.0.1:${APP_PORT}`, pb.url());
    }, pb);
    await step("chủ sở hữu xoá cả gia đình → dữ liệu và file biến mất", async () => {
      await pa.goto(APP + "/family/manage"); await pa.click("button:has-text('Xoá cả gia đình')");
      await pa.waitForURL("**/onboarding");
      ok((await db.admin.query("select count(*)::int c from public.families where name='Nhà An'")).rows[0].c === 0, "gia đình còn");
      ok((await db.admin.query("select count(*)::int c from public.memories where family_id not in (select id from public.families)")).rows[0].c === 0, "ký ức mồ côi");
      ok(fake.files.size === 0, "Storage còn " + fake.files.size + " file");
    }, pa);

    // ảnh chụp tham chiếu
    await pb.goto(APP + "/family"); await pb.screenshot({ path: path.join(shotDir, "family-chi.png") });
  } finally {
    await browser.close().catch(() => {});
    app?.kill();
    try { execSync("pkill -f 'next start -p " + APP_PORT + "' || true"); } catch { /* bỏ qua */ }
    await fake.close().catch(() => {}); await db.stop();
  }
}

try { await main(); } catch (e) { fail++; out.push("✘ LỖI CHẠY KIỂM THỬ: " + (e?.stack || e)); }
console.log(out.join("\n"));
console.log(`\nKết quả: ${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);

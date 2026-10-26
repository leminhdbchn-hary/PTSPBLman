// Kiểm thử đầu-cuối: bản build thật + Firebase Emulator (Auth + Firestore, luật bảo mật thật) + trình duyệt Chromium thật.
// Chạy: npm run test:e2e   (không chạm tới dự án Firebase thật: dùng project "demo-memo")
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROJECT = "demo-memo";
const APP_PORT = 4317;
const APP = `http://127.0.0.1:${APP_PORT}`;
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const OUT = path.join(root, "dist-e2e");
const shotDir = process.env.E2E_SHOTS || path.join(root, ".e2e-shots");
fs.mkdirSync(shotDir, { recursive: true });

// ---------- tiện ích ----------
let pass = 0, fail = 0;
const out = [];
async function step(name, fn, page) {
  try { await fn(); pass++; out.push("✔ " + name); }
  catch (e) {
    fail++;
    out.push(`✘ ${name}\n    ${String(e?.message ?? e).split("\n").slice(0, 4).join("\n    ")}`);
    if (page) {
      out.push("    url: " + page.url() + " | " + ((await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 500)).catch(() => "")) || ""));
      await page.screenshot({ path: path.join(shotDir, "FAIL-" + name.replace(/\W+/g, "_").slice(0, 50) + ".png") }).catch(() => {});
    }
  }
}
const ok = (c, msg) => { if (!c) throw new Error(msg); };

/** PNG chữ nhật w×h: nửa trái ĐỎ, nửa phải XANH (để kiểm tra phép cắt ảnh đúng vị trí). */
function pngSplit(w, h) {
  const crc = (buf) => { let c, v = ~0; for (let n = 0; n < buf.length; n++) { c = (v ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; v = (v >>> 8) ^ c; } return ~v >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cr]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const rows = [];
  for (let y = 0; y < h; y++) { const row = [0]; for (let x = 0; x < w; x++) row.push(...(x < w / 2 ? [230, 20, 20] : [20, 20, 230])); rows.push(Buffer.from(row)); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]);
}

/** PNG thật (gradient) để kiểm tra nén và hiển thị ảnh. */
function png(r, g, b, size = 64) {
  const crc = (buf) => { let c, v = ~0; for (let n = 0; n < buf.length; n++) { c = (v ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; v = (v >>> 8) ^ c; } return ~v >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(td)); return Buffer.concat([len, td, cr]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  const rows = [];
  for (let y = 0; y < size; y++) { const row = [0]; for (let x = 0; x < size; x++) row.push((r + x) & 255, (g + y) & 255, b); rows.push(Buffer.from(row)); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]);
}

/** Đọc thẳng Firestore giả lập với quyền quản trị (bỏ qua luật) để kiểm tra dữ liệu thật sự. */
async function adminList(p) {
  const r = await fetch(`${FS}/${p}?pageSize=300`, { headers: { Authorization: "Bearer owner" } });
  const j = await r.json();
  return j.documents ?? [];
}
async function adminGet(p) {
  const r = await fetch(`${FS}/${p}`, { headers: { Authorization: "Bearer owner" } });
  return r.status === 200 ? r.json() : null;
}
const val = (doc, k) => { const f = doc.fields?.[k]; return f ? (f.stringValue ?? f.booleanValue ?? f.integerValue ?? f.nullValue ?? f.timestampValue) : undefined; };
async function familyIdByName(name) {
  const fams = await adminList("nn_families");
  const f = fams.find((d) => val(d, "name") === name);
  return f ? f.name.split("/").pop() : null;
}
async function authUsers() {
  const r = await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:query`, { method: "POST", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" }, body: "{}" });
  const j = await r.json();
  return j.userInfo ?? [];
}
/** Lấy ID token của người đang đăng nhập trong trang (Firebase lưu ở IndexedDB). */
async function idToken(page) {
  return page.evaluate(() => new Promise((res) => {
    const rq = indexedDB.open("firebaseLocalStorageDb");
    rq.onsuccess = () => {
      const tx = rq.result.transaction("firebaseLocalStorage", "readonly");
      const all = tx.objectStore("firebaseLocalStorage").getAll();
      all.onsuccess = () => res(all.result.find((x) => x.fbase_key?.startsWith("firebase:authUser"))?.value?.stsTokenManager?.accessToken ?? null);
    };
    rq.onerror = () => res(null);
  }));
}

function waitPort(url, ms = 60000) {
  const t0 = Date.now();
  return new Promise((res, rej) => {
    const tick = () => fetch(url).then(() => res(), () => (Date.now() - t0 > ms ? rej(new Error("hết giờ chờ " + url)) : setTimeout(tick, 500)));
    tick();
  });
}

function serveStatic(dir, port) {
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json" };
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let f = path.join(dir, u);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(dir, "index.html");
    res.writeHead(200, { "Content-Type": types[path.extname(f)] ?? "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => server.listen(port, "127.0.0.1", () => r(server)));
}

// ---------- chạy ----------
async function main() {
  if (!process.env.SKIP_BUILD) {
    out.push("… build với VITE_USE_EMULATORS=1");
    execSync(`npx vite build --outDir ${OUT} --emptyOutDir`, { cwd: root, env: { ...process.env, VITE_USE_EMULATORS: "1", VITE_FIREBASE_PROJECT_ID: PROJECT }, stdio: "ignore" });
  }
  const emu = spawn("npx", ["firebase", "emulators:start", "--only", "auth,firestore", "--project", PROJECT], { cwd: root, stdio: "ignore", detached: true });
  await waitPort("http://127.0.0.1:8080/");
  await waitPort("http://127.0.0.1:9099/");
  await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  const server = await serveStatic(OUT, APP_PORT);
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const newCtx = async () => { const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true }); return ctx.newPage(); };
  const go = async (page, p) => { await page.goto(APP + p); await page.waitForFunction(() => !document.body.innerText.includes("Đang mở trang sổ"), null, { timeout: 15000 }).catch(() => {}); };
  const register = async (page, name, email, pw = "matkhau123", next = "") => {
    await go(page, `/register${next ? "?next=" + encodeURIComponent(next) : ""}`);
    await page.fill("#fullName", name); await page.fill("#email", email); await page.fill("#password", pw);
    await page.click("button[type=submit]");
  };
  const login = async (page, email, pw = "matkhau123") => {
    await go(page, "/login"); await page.fill("#email", email); await page.fill("#password", pw); await page.click("button[type=submit]");
  };
  const loadedImgs = (page, sel = "article img") => page.$$eval(sel, (els) => els.filter((e) => e.complete && e.naturalWidth > 0).length);

  try {
    const pa = await newCtx(), pb = await newCtx(), pc = await newCtx(), pd = await newCtx();
    let famA = "", memAId = "";

    // ---------- đăng ký / đăng nhập ----------
    await step("khách vào /family bị chuyển tới /login (có ?next=)", async () => {
      await go(pa, "/family/memories");
      await pa.waitForURL(/\/login\?next=%2Ffamily%2Fmemories/);
    }, pa);
    await step("trang chủ hiển thị, có nút tạo sổ", async () => {
      await go(pa, "/");
      ok(await pa.locator("h1:has-text('Mỗi gia đình')").isVisible(), "thiếu tiêu đề");
      ok(await pa.locator("a:has-text('Tạo sổ gia đình')").first().isVisible(), "thiếu nút");
    }, pa);
    await step("đăng ký sai: mật khẩu yếu báo lỗi tiếng Việt, không tạo tài khoản", async () => {
      await register(pa, "An Nguyễn", "an@example.com", "123");
      await pa.waitForSelector("text=ít nhất 8 ký tự");
      ok((await authUsers()).length === 0, "đã tạo tài khoản");
    }, pa);
    await step("đăng ký An → màn đặt tên gia đình", async () => {
      await pa.fill("#password", "matkhau123"); await pa.click("button[type=submit]");
      await pa.waitForURL("**/onboarding");
      await pa.waitForSelector("text=Hãy đặt tên cho gia đình");
      ok((await authUsers()).length === 1, "chưa tạo tài khoản");
      ok(await pa.locator("text=Chào An Nguyễn").count() > 0, "chưa hiện tên");
    }, pa);
    await step("đăng ký trùng email báo lỗi thân thiện", async () => {
      await register(pb, "An 2", "an@example.com");
      await pb.waitForSelector("text=Email này đã có tài khoản");
    }, pb);
    await step("đăng nhập sai mật khẩu báo lỗi (giữ lại email), đúng thì vào được", async () => {
      await login(pb, "an@example.com", "saimatkhau1");
      await pb.waitForSelector("text=Email hoặc mật khẩu chưa đúng");
      ok((await pb.inputValue("#email")) === "an@example.com", "ô email bị xoá");
      await pb.fill("#password", "matkhau123"); await pb.click("button[type=submit]");
      await pb.waitForURL("**/onboarding");
      await pb.context().clearCookies(); await pb.evaluate(() => indexedDB.deleteDatabase("firebaseLocalStorageDb"));
    }, pb);

    // ---------- gia đình & ký ức ----------
    await step("tạo gia đình “Nhà An” → tổng quan trống, là chủ sở hữu", async () => {
      await go(pa, "/onboarding");
      await pa.fill("#name", "Nhà An"); await pa.click("button[type=submit]");
      await pa.waitForURL(/\/family$/);
      await pa.waitForSelector("h1:has-text('Nhà An')");
      await pa.waitForSelector("text=Cuốn sổ còn trống");
      famA = await familyIdByName("Nhà An");
      const ms = await adminList(`nn_families/${famA}/members`);
      ok(ms.length === 1 && val(ms[0], "role") === "owner", "không phải owner");
    }, pa);
    await step("tạo ký ức có 2 ảnh thật → nén, lưu vào Firestore, hiện ở chi tiết", async () => {
      await go(pa, "/family/memories/new");
      await pa.fill("#title", "Bữa cơm chiều ngày mưa"); await pa.fill("#happenedOn", "2024-05-01"); await pa.fill("#body", "Cả nhà ngồi quanh mâm cơm.\nMưa rất to.");
      await pa.click("summary:has-text('Thêm chi tiết')"); await pa.click("button:has-text('Chuyến đi')");
      await pa.setInputFiles("input[type=file]", [{ name: "a.png", mimeType: "image/png", buffer: png(180, 90, 60) }, { name: "b.png", mimeType: "image/png", buffer: png(60, 120, 90) }]);
      await pa.waitForSelector("img[alt^='Ảnh sẽ tải lên']");
      await pa.click("button:has-text('Lưu vào sổ')");
      await pa.waitForURL(/\/family\/memories\/[A-Za-z0-9]{20}$/, { timeout: 30000 });
      memAId = pa.url().split("/").pop();
      await pa.waitForSelector("h1:has-text('Bữa cơm chiều ngày mưa')");
      await pa.waitForTimeout(500);
      ok((await loadedImgs(pa)) >= 2, "ảnh không hiển thị: " + (await loadedImgs(pa)));
      const photos = await adminList(`nn_families/${famA}/photos`);
      ok(photos.length === 2, "Firestore có " + photos.length + " ảnh");
      ok(photos.every((p) => String(val(p, "data")).startsWith("data:image/jpeg;base64,")), "ảnh chưa được nén JPEG");
      const m = await adminGet(`nn_families/${famA}/memories/${memAId}`);
      ok(String(val(m, "cover")).startsWith("data:image/jpeg"), "thiếu ảnh bìa");
    }, pa);
    await step("tạo ký ức thứ hai: chỉ viết vài dòng, không đặt tiêu đề → tự đặt tiêu đề; chọn “Chỉ mình tôi”", async () => {
      await go(pa, "/family/memories/new");
      await pa.click("button:has-text('Lưu vào sổ')");
      await pa.waitForSelector("text=Hãy thêm ảnh hoặc viết vài dòng");
      await pa.fill("#body", "Chiều nay mình ngồi nghĩ lại chuyện cũ. Nhiều điều chưa kể.");
      await pa.click("label:has-text('Chỉ mình tôi')");
      await pa.click("button:has-text('Lưu vào sổ')");
      await pa.waitForURL(/\/family\/memories\/[A-Za-z0-9]{20}$/);
      await pa.waitForSelector("h1:has-text('Chiều nay mình ngồi nghĩ lại chuyện cũ.')");
      const ms = await adminList(`nn_families/${famA}/memories`);
      ok(ms.some((m) => val(m, "visibility") === "private" && val(m, "title") === "Chiều nay mình ngồi nghĩ lại chuyện cũ."), "tiêu đề tự đặt / chế độ riêng tư sai");
    }, pa);
    await step("bản nháp: viết dở rồi rời trang → quay lại được khôi phục; lưu xong thì xoá nháp", async () => {
      await go(pa, "/family/memories/new");
      await pa.fill("#body", "Đoạn nháp chưa viết xong");
      await pa.waitForTimeout(700);
      await go(pa, "/family");
      await go(pa, "/family/memories/new");
      await pa.waitForSelector("text=khôi phục bản nháp");
      ok((await pa.inputValue("#body")) === "Đoạn nháp chưa viết xong", "chưa khôi phục nội dung");
      await pa.click("button:has-text('Bỏ bản nháp')");
      ok((await pa.inputValue("#body")) === "", "chưa bỏ nháp");
      await pa.fill("#body", "Nháp để thử lưu"); await pa.waitForTimeout(700);
      await pa.click("button:has-text('Lưu vào sổ')"); await pa.waitForURL(/\/family\/memories\/[A-Za-z0-9]{20}$/);
      await go(pa, "/family/memories/new");
      await pa.waitForTimeout(500);
      ok((await pa.locator("text=khôi phục bản nháp").count()) === 0 && (await pa.inputValue("#body")) === "", "bản nháp còn sau khi lưu");
    }, pa);
    await step("chọn ảnh → ngày xảy ra tự lấy từ ngày chụp của ảnh", async () => {
      await go(pa, "/family/memories/new");
      await pa.evaluate(async () => {
        const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
        const dt = new DataTransfer();
        dt.items.add(new File([bytes], "x.png", { type: "image/png", lastModified: Date.UTC(2021, 6, 4, 12) }));
        const input = document.querySelector("input[type=file]");
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await pa.waitForSelector("text=lấy ngày từ ảnh");
      ok((await pa.inputValue("#happenedOn")) === "2021-07-04", "ngày sai: " + (await pa.inputValue("#happenedOn")));
    }, pa);
    await step("dòng thời gian: nhóm theo năm, gõ là lọc ngay (không dấu), lọc theo chủ đề, bỏ lọc", async () => {
      await go(pa, "/family/memories");
      await pa.waitForSelector("h2:has-text('2024')");
      await pa.fill("#q", "mam com");
      await pa.waitForFunction(() => document.querySelectorAll("article").length === 1);
      ok((await pa.locator("article h3").first().textContent()) === "Bữa cơm chiều ngày mưa", "tìm sai");
      await pa.click("button:has-text('Bỏ lọc')");
      await pa.click("button:has-text('Lọc')");
      await pa.selectOption("#tag", "Chuyến đi");
      await pa.waitForFunction(() => document.querySelectorAll("article").length === 1);
      await pa.click("button:has-text('Bỏ lọc')");
      await pa.waitForFunction(() => document.querySelectorAll("article").length >= 3);
    }, pa);
    await step("chi tiết ký ức: nút ký ức trước/sau; vuốt ngang trong khung xem ảnh lớn", async () => {
      await go(pa, `/family/memories/${memAId}`);
      await pa.waitForSelector("nav[aria-label='Ký ức kế tiếp']");
      ok((await pa.locator("nav[aria-label='Ký ức kế tiếp'] a").count()) >= 1, "thiếu liên kết ký ức kế tiếp");
      await pa.click("button[aria-label^='Xem ảnh lớn']");
      await pa.waitForSelector("[role=dialog]");
      ok((await pa.locator("[role=dialog] p:has-text('1 / 2')").count()) === 1, "thiếu bộ đếm ảnh");
      await pa.evaluate(() => {
        const el = document.querySelector("[role=dialog]");
        const t = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 });
        el.dispatchEvent(new TouchEvent("touchstart", { touches: [t(300)], changedTouches: [t(300)], bubbles: true }));
        el.dispatchEvent(new TouchEvent("touchend", { touches: [], changedTouches: [t(80)], bubbles: true }));
      });
      await pa.waitForSelector("[role=dialog] p:has-text('2 / 2')");
      await pa.keyboard.press("Escape");
      await pa.waitForSelector("[role=dialog]", { state: "detached" });
    }, pa);

    // ---------- cách ly hai gia đình ----------
    let famC = "";
    await step("Chi tạo gia đình riêng và một ký ức", async () => {
      await register(pc, "Chi Trần", "chi@example.com");
      await pc.waitForURL("**/onboarding");
      await pc.fill("#name", "Nhà Chi"); await pc.click("button[type=submit]");
      await pc.waitForURL(/\/family$/);
      await go(pc, "/family/memories/new"); await pc.fill("#title", "Bí mật nhà Chi"); await pc.click("button:has-text('Lưu vào sổ')");
      await pc.waitForURL(/\/family\/memories\/[A-Za-z0-9]{20}$/);
      famC = await familyIdByName("Nhà Chi");
    }, pc);
    await step("CÁCH LY: Chi mở URL ký ức nhà An → không thấy; danh sách chỉ có của mình", async () => {
      await go(pc, `/family/memories/${memAId}`);
      await pc.waitForSelector("text=Không tìm thấy trang này");
      await go(pc, "/family/memories");
      const titles = await pc.$$eval("article h3", (e) => e.map((x) => x.textContent));
      ok(titles.length === 1 && titles[0] === "Bí mật nhà Chi", JSON.stringify(titles));
    }, pc);
    await step("CÁCH LY: dùng chính token của Chi gọi thẳng API Firestore vào nhà An → bị từ chối", async () => {
      const t = await idToken(pc);
      ok(t, "không lấy được token");
      const H = { Authorization: "Bearer " + t, "Content-Type": "application/json" };
      const r1 = await fetch(`${FS}/nn_families/${famA}/memories/${memAId}`, { headers: H });
      ok(r1.status === 403, "đọc được ký ức nhà An: " + r1.status);
      const r2 = await fetch(`${FS}/nn_families/${famA}`, { headers: H });
      ok(r2.status === 403, "đọc được gia đình An: " + r2.status);
      const r3 = await fetch(`${FS}/nn_families/${famA}/memories/${memAId}?updateMask.fieldPaths=title`, { method: "PATCH", headers: H, body: JSON.stringify({ fields: { title: { stringValue: "bị sửa" } } }) });
      ok(r3.status === 403, "sửa được ký ức nhà An: " + r3.status);
      const r4 = await fetch(`${FS}/nn_families/${famA}/memories/${memAId}`, { method: "DELETE", headers: H });
      ok(r4.status === 403, "xoá được ký ức nhà An: " + r4.status);
      const r5 = await fetch(`${FS}/nn_families/${famA}/members?documentId=chi`, { method: "POST", headers: H, body: JSON.stringify({ fields: { uid: { stringValue: "x" }, role: { stringValue: "owner" }, name: { stringValue: "Chi" } } }) });
      ok(r5.status === 403, "tự thêm mình vào nhà An: " + r5.status);
      const m = await adminGet(`nn_families/${famA}/memories/${memAId}`);
      ok(val(m, "title") === "Bữa cơm chiều ngày mưa", "ký ức nhà An bị thay đổi");
    }, pc);

    // ---------- lời mời ----------
    let inviteLink = "";
    await step("An tạo lời mời (chỉ xem) → liên kết hiện một lần; DB chỉ lưu băm", async () => {
      await go(pa, "/family/manage");
      await pa.selectOption("#role", "viewer");
      await pa.click("button:has-text('Tạo liên kết mời')");
      await pa.waitForSelector("input[aria-label='Liên kết mời']");
      inviteLink = await pa.inputValue("input[aria-label='Liên kết mời']");
      ok(inviteLink.startsWith(APP + "/invite/" + famA + "/"), inviteLink);
      const token = inviteLink.split("/").pop();
      const inv = await adminList(`nn_families/${famA}/invites`);
      ok(inv.length === 1 && inv[0].name.split("/").pop().length === 64 && !JSON.stringify(inv[0]).includes(token), "DB lưu mã gốc");
    }, pa);
    await step("Bình mở lời mời khi chưa đăng nhập → thấy tên gia đình; đăng ký xong quay lại và tham gia", async () => {
      await pb.goto(inviteLink);
      await pb.waitForSelector("text=Tham gia “Nhà An”");
      await pb.click("a:has-text('Tạo tài khoản để tham gia')");
      await pb.fill("#fullName", "Bình Lê"); await pb.fill("#email", "binh@example.com"); await pb.fill("#password", "matkhau123"); await pb.click("button[type=submit]");
      await pb.waitForURL(/\/invite\//);
      await pb.click("button:has-text('Tham gia gia đình')");
      await pb.waitForURL(/\/family$/);
      await pb.waitForSelector("h1:has-text('Nhà An')");
    }, pb);
    await step("lời mời dùng một lần: người khác mở lại thấy báo đã dùng", async () => {
      await pd.goto(inviteLink);
      await pd.waitForSelector("text=Lời mời không dùng được");
      await pd.waitForSelector("text=đã được dùng");
    }, pd);
    await step("Bình (chỉ xem) thấy ký ức cả nhà, không thấy nhật ký riêng của An; không có nút thêm/quản lý", async () => {
      await go(pb, "/family/memories");
      await pb.waitForSelector("article h3");
      const titles = await pb.$$eval("article h3", (e) => e.map((x) => x.textContent));
      ok(titles.includes("Bữa cơm chiều ngày mưa") && !titles.includes("Chiều nay mình ngồi nghĩ lại chuyện cũ."), JSON.stringify(titles));
      ok((await pb.locator("a:has-text('Thêm ký ức')").count()) === 0, "viewer thấy nút thêm");
      ok((await pb.locator("a:has-text('Quản lý')").count()) === 0, "viewer thấy Quản lý");
      await go(pb, "/family/memories/new"); await pb.waitForURL(/\/family\/memories$/);
      await go(pb, "/family/manage"); await pb.waitForURL(/\/family$/);
    }, pb);
    await step("ảnh của gia đình: thành viên xem được", async () => {
      await go(pb, `/family/memories/${memAId}`);
      await pb.waitForSelector("h1:has-text('Bữa cơm')");
      await pb.waitForTimeout(400);
      ok((await loadedImgs(pb)) >= 2, "Bình không thấy ảnh: " + (await loadedImgs(pb)));
    }, pb);
    await step("người chỉ xem vẫn để lại lời nhắn được", async () => {
      await pb.fill("#cbody", "Nhớ quá!"); await pb.click("button:has-text('Gửi')");
      await pb.waitForSelector("li:has-text('Nhớ quá!')");
      ok((await pb.inputValue("#cbody")) === "", "ô lời nhắn chưa được xoá");
    }, pb);
    await step("An nâng Bình lên Đóng góp → Bình thêm được ký ức riêng tư", async () => {
      await go(pa, "/family/manage");
      const sel = pa.locator("select[id^='r-']");
      await sel.selectOption("contributor"); await sel.locator("xpath=ancestor::form").locator("button").click();
      await pa.waitForSelector("text=Đã đổi vai trò");
      await pb.reload(); // vai trò được đọc lại khi mở trang
      await go(pb, "/family/memories/new"); await pb.fill("#title", "Chuyến đi của Bình"); await pb.click("label:has-text('Chỉ mình tôi')"); await pb.click("button:has-text('Lưu vào sổ')");
      await pb.waitForURL(/\/family\/memories\/[A-Za-z0-9]{20}$/);
    }, pb);
    await step("ký ức riêng tư của Bình KHÔNG hiện với An (kể cả chủ sở hữu)", async () => {
      await go(pa, "/family/memories");
      await pa.waitForSelector("article h3");
      const titles = await pa.$$eval("article h3", (e) => e.map((x) => x.textContent));
      ok(!titles.includes("Chuyến đi của Bình"), JSON.stringify(titles));
    }, pa);
    await step("Bình sửa được ký ức của mình, không sửa/xoá được ký ức của An", async () => {
      await pb.click("a:has-text('Sửa ký ức')");
      await pb.waitForURL(/\/edit$/);
      await pb.fill("#title", "Chuyến đi của Bình (sửa)"); await pb.click("button:has-text('Lưu thay đổi')");
      await pb.waitForSelector("h1:has-text('Chuyến đi của Bình (sửa)')");
      await go(pb, `/family/memories/${memAId}`);
      await pb.waitForSelector("h1:has-text('Bữa cơm')");
      ok((await pb.locator("text=Sửa ký ức").count()) === 0 && (await pb.locator("button:has-text('Xoá ký ức')").count()) === 0, "thấy nút sửa/xoá");
      await go(pb, `/family/memories/${memAId}/edit`);
      await pb.waitForURL(new RegExp(`/family/memories/${memAId}$`));
    }, pb);

    // ---------- hồ sơ & gia phả ----------
    // màu điểm ảnh của ảnh đại diện đang xem trước (đọc từ data URL)
    const sample = (page) => page.evaluate(async () => {
      const src = [...document.querySelectorAll("img")].map((i) => i.src).find((u) => u.startsWith("data:image/jpeg"));
      if (!src) return null;
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0);
      const px = (x, y) => Array.from(g.getImageData(x, y, 1, 1).data.slice(0, 3));
      return { w: img.naturalWidth, h: img.naturalHeight, left: px(40, c.height / 2), right: px(c.width - 40, c.height / 2) };
    });
    const redish = (p) => p[0] > 150 && p[2] < 110, blueish = (p) => p[2] > 150 && p[0] < 110;
    await step("ẢNH ĐẠI DIỆN: chọn ảnh → cửa sổ cắt; mặc định cắt giữa ảnh đúng vị trí, ra ảnh vuông 320 px", async () => {
      await go(pa, "/family/members/new");
      await pa.fill("#fullName", "Ông Hải"); await pa.fill("#relationLabel", "Ông nội"); await pa.fill("#birthDate", "1940-03-02");
      await pa.setInputFiles("input[aria-label='Chọn ảnh đại diện']", { name: "o.png", mimeType: "image/png", buffer: pngSplit(400, 200) });
      await pa.waitForSelector("[role=dialog] >> text=Cắt ảnh đại diện");
      await pa.waitForSelector("[data-testid=crop-box] img");
      await pa.click("button:has-text('Dùng ảnh này')");
      await pa.waitForSelector("[role=dialog]", { state: "detached" });
      const r = await sample(pa);
      ok(r && r.w === 320 && r.h === 320, "ảnh không vuông 320: " + JSON.stringify(r));
      // ảnh gốc 400×200 cắt giữa → hình vuông 200×200: nửa trái đỏ, nửa phải xanh
      ok(redish(r.left) && blueish(r.right), "cắt giữa sai: " + JSON.stringify(r));
    }, pa);
    await step("ẢNH ĐẠI DIỆN: kéo ảnh sang trái → khung cắt chuyển sang phần xanh; phóng to; xoay; Huỷ không đổi gì", async () => {
      await pa.click("button:has-text('Đổi ảnh đại diện')");
      await pa.waitForSelector("[data-testid=crop-box] img", { state: "visible" }).catch(() => {});
      await pa.setInputFiles("input[aria-label='Chọn ảnh đại diện']", { name: "o.png", mimeType: "image/png", buffer: pngSplit(400, 200) }).catch(() => {});
      await pa.waitForSelector("[data-testid=crop-box] img");
      const bx = await pa.locator("[data-testid=crop-box]").boundingBox();
      await pa.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2);
      await pa.mouse.down(); await pa.mouse.move(bx.x + bx.width / 2 - 300, bx.y + bx.height / 2, { steps: 8 }); await pa.mouse.up();
      await pa.click("button:has-text('Dùng ảnh này')");
      await pa.waitForSelector("[role=dialog]", { state: "detached" });
      const r = await sample(pa);
      ok(blueish(r.left) && blueish(r.right), "kéo sang trái phải ra toàn xanh: " + JSON.stringify(r));
      // phóng to ×3 ở giữa: vẫn nửa đỏ nửa xanh (vì giữa ảnh là đường chia)
      await pa.setInputFiles("input[aria-label='Chọn ảnh đại diện']", { name: "o.png", mimeType: "image/png", buffer: pngSplit(400, 200) });
      await pa.waitForSelector("[data-testid=crop-box] img");
      await pa.locator("#crop-zoom").fill("3");
      await pa.click("button:has-text('Xoay')");
      await pa.waitForTimeout(300);
      await pa.click("button:has-text('Huỷ')");
      await pa.waitForSelector("[role=dialog]", { state: "detached" });
      const r2 = await sample(pa);
      ok(JSON.stringify(r2) === JSON.stringify(r), "Huỷ mà ảnh vẫn đổi");
    }, pa);
    await step("ẢNH ĐẠI DIỆN: ảnh có kiểu tệp rỗng (.JPG từ thư viện ảnh Android/Windows) vẫn mở được; tệp không phải ảnh báo lỗi dễ hiểu", async () => {
      await pa.evaluate(() => {
        const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
        const dt = new DataTransfer(); dt.items.add(new File([bytes], "IMG_0001.PNG", { type: "" }));
        const input = document.querySelector("input[aria-label='Chọn ảnh đại diện']"); input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await pa.waitForSelector("[role=dialog] >> text=Cắt ảnh đại diện");
      await pa.keyboard.press("Escape");
      await pa.waitForSelector("[role=dialog]", { state: "detached" });
      await pa.setInputFiles("input[aria-label='Chọn ảnh đại diện']", { name: "ghi-chu.txt", mimeType: "text/plain", buffer: Buffer.from("không phải ảnh") });
      await pa.waitForSelector("text=không phải ảnh được hỗ trợ");
      ok((await pa.locator("[role=dialog]").count()) === 0, "mở cửa sổ cắt với tệp không phải ảnh");
      // ảnh hỏng (đuôi .png nhưng nội dung không phải ảnh) → báo lỗi trong cửa sổ cắt
      await pa.setInputFiles("input[aria-label='Chọn ảnh đại diện']", { name: "hong.png", mimeType: "image/png", buffer: Buffer.from("rác rưởi") });
      await pa.waitForSelector("[role=dialog] [role=alert]");
      await pa.click("[role=dialog] button:has-text('Đóng')");
    }, pa);
    await step("thêm hồ sơ có ảnh đại diện (cắt) và ngày sinh ẩn → lưu và hiện ở trang hồ sơ", async () => {
      await pa.click("button:has-text('Thêm hồ sơ')");
      await pa.waitForSelector("h1:has-text('Ông Hải')");
      await pa.waitForSelector("text=sinh 2 tháng 3, 1940");
      ok((await loadedImgs(pa, "header img")) === 1, "ảnh đại diện không hiện");
      const dims = await pa.$eval("header img", (i) => [i.naturalWidth, i.naturalHeight]);
      ok(dims[0] === 320 && dims[1] === 320, "ảnh lưu không vuông 320: " + dims);
    }, pa);
    await step("ẢNH ĐẠI DIỆN: sửa hồ sơ → đổi ảnh khác, rồi “Bỏ ảnh” → quay về chữ cái đầu", async () => {
      await pa.click("a:has-text('Sửa hồ sơ')");
      await pa.waitForSelector("#fullName");
      await pa.setInputFiles("input[aria-label='Chọn ảnh đại diện']", { name: "m.png", mimeType: "image/png", buffer: png(10, 200, 90, 128) });
      await pa.waitForSelector("[data-testid=crop-box] img");
      await pa.click("button:has-text('Dùng ảnh này')");
      await pa.click("button:has-text('Lưu thay đổi')");
      await pa.waitForSelector("h1:has-text('Ông Hải')");
      await pa.waitForTimeout(500);
      ok((await loadedImgs(pa, "header img")) === 1, "ảnh mới không hiện");
      await pa.click("a:has-text('Sửa hồ sơ')");
      await pa.waitForSelector("button:has-text('Bỏ ảnh')");
      await pa.click("button:has-text('Bỏ ảnh')");
      await pa.click("button:has-text('Lưu thay đổi')");
      await pa.waitForSelector("h1:has-text('Ông Hải')");
      ok((await pa.locator("header img").count()) === 0, "ảnh vẫn còn sau khi bỏ");
    }, pa);
    await step("ngày sinh riêng tư: Bình không thấy ngày sinh của Ông Hải", async () => {
      await go(pb, "/family/members");
      await pb.click("a:has-text('Ông Hải')");
      await pb.waitForSelector("h1:has-text('Ông Hải')");
      ok((await pb.locator("text=1940").count()) === 0, "lộ ngày sinh");
    }, pb);
    await step("gia phả: nối quan hệ, sơ đồ theo thế hệ, chặn vòng lặp", async () => {
      for (const n of ["Bố Minh", "Bé An"]) {
        await go(pa, "/family/members/new"); await pa.fill("#fullName", n); await pa.click("button:has-text('Thêm hồ sơ')"); await pa.waitForSelector(`h1:has-text('${n}')`);
      }
      await go(pa, "/family/tree");
      const link = async (a, kind, b, expect) => {
        await pa.selectOption("#personA", { label: a }); await pa.selectOption("#kind", kind); await pa.selectOption("#personB", { label: b });
        await pa.click("button:has-text('Thêm quan hệ')");
        await pa.waitForSelector(`text=${expect}`);
        await pa.waitForFunction(() => !document.querySelector("button[aria-busy='true']"));
      };
      await link("Ông Hải", "parent", "Bố Minh", "Đã thêm quan hệ");
      await link("Bố Minh", "parent", "Bé An", "Đã thêm quan hệ");
      await pa.waitForSelector("text=Thế hệ thứ 3");
      await link("Bé An", "parent", "Ông Hải", "vòng lặp");
      ok((await adminList(`nn_families/${famA}/relationships`)).length === 2, "quan hệ vòng lặp đã lọt vào DB");
    }, pa);

    // ---------- dữ liệu mẫu ----------
    await step("thêm dữ liệu mẫu → có nhãn “Mẫu”; xoá mẫu giữ nguyên nội dung thật", async () => {
      await go(pa, "/family/manage");
      await pa.click("button:has-text('Thêm dữ liệu mẫu')");
      await pa.waitForURL(/\/family\/memories$/, { timeout: 30000 });
      await pa.waitForSelector("article >> text=· Mẫu");
      ok((await pa.locator("article:has-text('· Mẫu')").count()) >= 5, "thiếu nhãn mẫu");
      ok((await pa.$$eval("article img", (els) => els.filter((e) => e.src.includes("/demo/")).length)) >= 5, "thiếu ảnh minh hoạ mẫu");
      await pa.waitForFunction(() => { const i = document.querySelector("article img[src*='/demo/']"); return i && i.complete && i.naturalWidth > 0; });
      await go(pa, "/family/manage");
      await pa.click("button:has-text('Xoá dữ liệu mẫu')");
      await pa.click("button:has-text('Xoá dữ liệu mẫu') >> nth=-1");
      await pa.waitForSelector("text=Đã xoá dữ liệu mẫu");
      await go(pa, "/family/memories");
      await pa.waitForSelector("article");
      ok((await pa.locator("article").count()) === 3, "sau khi xoá mẫu phải còn 3 ký ức thật của An: " + (await pa.locator("article").count()));
      ok((await adminList(`nn_families/${famA}/people`)).every((p) => val(p, "isDemo") !== true), "còn hồ sơ mẫu");
    }, pa);

    // ---------- xoá ký ức ----------
    await step("xoá ký ức (xác nhận hai bước) → ảnh và lời nhắn cũng bị xoá", async () => {
      await go(pa, `/family/memories/${memAId}`);
      await pa.click("button:has-text('Xoá ký ức')");
      await pa.click("button:has-text('Xoá hẳn')");
      await pa.waitForURL(/memories\?deleted=1/);
      await pa.waitForSelector("text=Đã xoá ký ức");
      ok(!(await adminGet(`nn_families/${famA}/memories/${memAId}`)), "ký ức còn trong DB");
      ok((await adminList(`nn_families/${famA}/photos`)).length === 0, "ảnh còn trong DB");
      ok((await adminList(`nn_families/${famA}/memories/${memAId}/comments`)).length === 0, "lời nhắn còn trong DB");
    }, pa);

    // ---------- cài đặt ----------
    await step("cài đặt: sửa hồ sơ, đổi mật khẩu (sai mật khẩu cũ bị chặn)", async () => {
      await go(pa, "/settings");
      await pa.waitForSelector("#fullName");
      await pa.fill("#fullName", "An Nguyễn Văn"); await pa.click("button:has-text('Lưu hồ sơ')"); await pa.waitForSelector("text=Đã lưu hồ sơ của bạn");
      await pa.fill("#current", "saimatkhau9"); await pa.fill("#password", "matkhaumoi1"); await pa.fill("#confirm", "matkhaumoi1");
      await pa.click("button:has-text('Đổi mật khẩu')"); await pa.waitForSelector("text=Mật khẩu hiện tại chưa đúng");
      await pa.fill("#current", "matkhau123"); await pa.click("button:has-text('Đổi mật khẩu')"); await pa.waitForSelector("text=Đã đổi mật khẩu");
      const ms = await adminList(`nn_families/${famA}/members`);
      ok(ms.some((m) => val(m, "name") === "An Nguyễn Văn"), "tên trong gia đình chưa cập nhật");
    }, pa);
    await step("xuất dữ liệu JSON cả gia đình (không có ký ức riêng tư của người khác)", async () => {
      const [dl] = await Promise.all([pa.waitForEvent("download"), pa.click("button:has-text('Tải dữ liệu cả gia đình')")]);
      const data = JSON.parse(fs.readFileSync(await dl.path(), "utf8"));
      ok(data.family?.name === "Nhà An" && Array.isArray(data.memories), "JSON sai");
      const s = JSON.stringify(data);
      ok(!s.includes("Bí mật nhà Chi") && !s.includes("Chuyến đi của Bình"), "xuất lộ dữ liệu không được phép");
    }, pa);
    await step("thành viên rời gia đình → quay về màn tạo gia đình, ký ức riêng tư của mình bị xoá", async () => {
      await go(pb, "/settings");
      await pb.click("button:has-text('Rời khỏi gia đình')");
      await pb.waitForURL(/\/onboarding$/);
      const ms = await adminList(`nn_families/${famA}/memories`);
      ok(!ms.some((m) => String(val(m, "title")).startsWith("Chuyến đi của Bình")), "ký ức riêng tư của Bình còn lại");
    }, pb);
    await step("đăng xuất; sau đó /family chuyển về /login", async () => {
      await go(pa, "/family");
      await pa.click("button:has-text('Đăng xuất')");
      await pa.waitForURL(APP + "/");
      await go(pa, "/family"); await pa.waitForURL(/\/login/);
    }, pa);
    await step("đăng nhập bằng mật khẩu MỚI; mật khẩu cũ không dùng được nữa", async () => {
      await login(pa, "an@example.com", "matkhau123");
      await pa.waitForSelector("text=Email hoặc mật khẩu chưa đúng");
      await pa.fill("#password", "matkhaumoi1"); await pa.click("button[type=submit]");
      await pa.waitForURL(/\/family$/);
    }, pa);
    await step("quên mật khẩu: trả lời giống nhau dù email có tồn tại hay không", async () => {
      for (const email of ["an@example.com", "khongco@example.com"]) {
        await go(pd, "/forgot-password"); await pd.fill("#email", email); await pd.click("button[type=submit]");
        await pd.waitForSelector("text=Nếu email này có tài khoản");
      }
    }, pd);
    await step("?next= chỉ chấp nhận đường dẫn nội bộ", async () => {
      await go(pd, "/login?next=" + encodeURIComponent("https://evil.example.com"));
      await pd.fill("#email", "chi@example.com"); await pd.fill("#password", "matkhau123"); await pd.click("button[type=submit]");
      await pd.waitForURL(/\/family$/);
      ok(new URL(pd.url()).host === `127.0.0.1:${APP_PORT}`, pd.url());
    }, pd);
    await step("xoá tài khoản (cần mật khẩu + gõ XOA): gia đình chỉ có mình Chi bị xoá theo, không đăng nhập lại được", async () => {
      await go(pc, "/settings");
      await pc.fill("#delpw", "matkhau123"); await pc.fill("#xoa", "xoa sai");
      await pc.click("button:has-text('Xoá tài khoản vĩnh viễn')");
      await pc.waitForSelector("text=Bạn gõ chữ XOA");
      await pc.fill("#xoa", "XOA"); await pc.click("button:has-text('Xoá tài khoản vĩnh viễn')");
      await pc.waitForURL(/\/\?deleted=1$/, { timeout: 30000 });
      ok(!(await authUsers()).some((u) => u.email === "chi@example.com"), "tài khoản Chi còn");
      ok(!(await adminGet(`nn_families/${famC}`)), "gia đình của Chi còn");
      ok((await adminList(`nn_families/${famC}/memories`)).length === 0, "ký ức của Chi còn");
      await login(pc, "chi@example.com"); await pc.waitForSelector("text=Email hoặc mật khẩu chưa đúng");
    }, pc);
    await step("ĐIỆN THOẠI (390×844): thanh điều hướng dưới + nút “+”; form có thanh Lưu cố định; menu gọn; không tràn ngang", async () => {
      const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
      const pm = await ctxM.newPage();
      await login(pm, "an@example.com", "matkhaumoi1");
      await pm.waitForURL(/\/family$/);
      await pm.waitForSelector("nav[aria-label='Điều hướng chính']");
      ok(!(await pm.locator("nav[aria-label='Khu vực gia đình']").isVisible()), "thanh trên (máy tính) vẫn hiện trên điện thoại");
      const over = await pm.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(over <= 0, "tràn ngang " + over + "px");
      await pm.click("a[aria-label='Thêm ký ức mới']");
      await pm.waitForURL(/\/memories\/new$/);
      ok(!(await pm.locator("nav[aria-label='Điều hướng chính']").isVisible().catch(() => false)), "thanh dưới còn hiện trong form");
      const save = pm.locator("button:has-text('Lưu vào sổ')");
      await save.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
      ok(await save.isVisible(), "không thấy nút Lưu");
      const box = await save.boundingBox();
      ok(box && box.y + box.height <= 844 && box.height >= 44, "nút Lưu không nằm trong màn hình hoặc quá nhỏ: " + JSON.stringify(box));
      const fs = await pm.$$eval("input:not([type=file]):not([type=radio]), textarea, select", (e) => e.filter((x) => x.getBoundingClientRect().width > 0 && parseFloat(getComputedStyle(x).fontSize) < 16).length);
      ok(fs === 0, fs + " ô nhập nhỏ hơn 16px (iPhone sẽ tự phóng to)");
      await pm.fill("#body", "Ký ức viết từ điện thoại"); await save.click();
      await pm.waitForURL(/\/family\/memories\/[A-Za-z0-9]{20}$/);
      await pm.waitForSelector("h1:has-text('Ký ức viết từ điện thoại')");
      await pm.click("nav[aria-label='Điều hướng chính'] a:has-text('Ký ức')");
      await pm.waitForSelector("article");
      ok((await pm.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0, "danh sách ký ức tràn ngang");
      await pm.goto(APP + "/family/members/new");
      await pm.waitForSelector("#fullName");
      await pm.setInputFiles("input[aria-label='Chọn ảnh đại diện']", { name: "m.png", mimeType: "image/png", buffer: pngSplit(300, 400) });
      await pm.waitForSelector("[data-testid=crop-box] img");
      const okBtn = await pm.locator("button:has-text('Dùng ảnh này')").boundingBox();
      const cb = await pm.locator("[data-testid=crop-box]").boundingBox();
      ok(okBtn && okBtn.y + okBtn.height <= 844 && okBtn.height >= 44, "nút Dùng ảnh này ngoài màn hình/quá nhỏ: " + JSON.stringify(okBtn));
      ok(cb && cb.x >= 0 && cb.x + cb.width <= 390, "khung cắt tràn ngang: " + JSON.stringify(cb));
      await pm.click("button:has-text('Huỷ')");
      await pm.goto(APP + "/family/memories");
      await pm.waitForSelector("article");
      await pm.click("summary[aria-label='Mở menu']");
      await pm.click("[role=menu] >> text=Cài đặt");
      await pm.waitForURL(/\/settings$/);
      await ctxM.close();
    }, pa);
    await step("chủ sở hữu xoá cả gia đình → mọi dữ liệu biến mất", async () => {
      await go(pa, "/family/manage");
      await pa.click("button:has-text('Xoá cả gia đình')");
      await pa.click("button:has-text('Xoá vĩnh viễn')");
      await pa.waitForURL(/\/onboarding$/, { timeout: 30000 });
      ok(!(await adminGet(`nn_families/${famA}`)), "gia đình còn");
      for (const c of ["members", "memories", "photos", "people", "relationships", "invites", "registry"]) {
        ok((await adminList(`nn_families/${famA}/${c}`)).length === 0, "còn dữ liệu trong " + c);
      }
    }, pa);

    // ảnh chụp tham chiếu
    await go(pa, "/"); await pa.screenshot({ path: path.join(shotDir, "home.png") });
  } finally {
    await browser.close().catch(() => {});
    server.close();
    try { process.kill(-emu.pid, "SIGTERM"); } catch { /* đã tắt */ }
  }
}

try { await main(); } catch (e) { fail++; out.push("✘ LỖI CHẠY KIỂM THỬ: " + (e?.stack || e)); }
console.log(out.join("\n"));
console.log(`\nKết quả: ${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);

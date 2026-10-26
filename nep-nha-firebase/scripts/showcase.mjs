// Chụp ảnh các màn hình chính (dữ liệu mẫu, chạy trên Firebase Emulator). Dùng: node scripts/showcase.mjs <thư mục ảnh>
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = process.argv[2] || path.join(root, ".e2e-shots");
fs.mkdirSync(outDir, { recursive: true });
const OUT = path.join(root, "dist-e2e"), APP = "http://127.0.0.1:4318";
if (!process.env.SKIP_BUILD) execSync(`npx vite build --outDir ${OUT} --emptyOutDir`, { cwd: root, env: { ...process.env, VITE_USE_EMULATORS: "1", VITE_FIREBASE_PROJECT_ID: "demo-nepnha" }, stdio: "ignore" });
const emu = spawn("npx", ["firebase", "emulators:start", "--only", "auth,firestore", "--project", "demo-nepnha"], { cwd: root, stdio: "ignore", detached: true });
const wait = (u) => new Promise((r) => { const t = () => fetch(u).then(r, () => setTimeout(t, 500)); t(); });
await wait("http://127.0.0.1:8080/"); await wait("http://127.0.0.1:9099/");
await fetch("http://127.0.0.1:8080/emulator/v1/projects/demo-nepnha/databases/(default)/documents", { method: "DELETE" });
await fetch("http://127.0.0.1:9099/emulator/v1/projects/demo-nepnha/accounts", { method: "DELETE" });
const server = http.createServer((req, res) => { let f = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(OUT, "index.html"); res.writeHead(200, { "Content-Type": { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".html": "text/html; charset=utf-8" }[path.extname(f)] ?? "application/octet-stream" }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => server.listen(4318, "127.0.0.1", r));
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
try {
  const p = await (await b.newContext({ viewport: { width: 1280, height: 860 } })).newPage();
  const shot = async (n, full = true) => { await p.waitForTimeout(700); await p.screenshot({ path: path.join(outDir, n + ".png"), fullPage: full }); };
  await p.goto(APP + "/"); await shot("01-trang-chu");
  await p.goto(APP + "/register"); await p.fill("#fullName", "Lê Minh An"); await p.fill("#email", "an@example.com"); await p.fill("#password", "matkhau123"); await p.click("button[type=submit]");
  await p.waitForURL("**/onboarding"); await p.fill("#name", "Gia đình nhà Lê"); await p.click("button[type=submit]"); await p.waitForURL(/\/family$/);
  await p.goto(APP + "/family/manage"); await p.click("button:has-text('Thêm dữ liệu mẫu')"); await p.waitForURL(/\/family\/memories$/, { timeout: 30000 }); await p.waitForSelector("article");
  await shot("02-dong-thoi-gian");
  await p.click("article a"); await p.waitForSelector("h1"); await shot("03-chi-tiet-ky-uc");
  await p.goto(APP + "/family"); await p.waitForSelector("article"); await shot("04-tong-quan", false);
  await p.goto(APP + "/family/tree"); await p.waitForSelector("text=Thế hệ thứ 3"); await shot("05-gia-pha");
  await p.goto(APP + "/family/manage"); await p.waitForSelector("text=Mời người thân"); await shot("06-quan-ly");
  const m = await (await b.newContext({ viewport: { width: 390, height: 820 }, deviceScaleFactor: 2 })).newPage();
  await m.goto(APP + "/login"); await m.fill("#email", "an@example.com"); await m.fill("#password", "matkhau123"); await m.click("button[type=submit]"); await m.waitForURL(/\/family$/);
  await m.goto(APP + "/family/memories"); await m.waitForSelector("article"); await m.waitForTimeout(600); await m.screenshot({ path: path.join(outDir, "07-dien-thoai.png") });
  await m.goto(APP + "/"); await m.click("summary"); await m.waitForTimeout(300); await m.screenshot({ path: path.join(outDir, "08-dien-thoai-menu.png") });
} finally { await b.close(); server.close(); try { process.kill(-emu.pid, "SIGTERM"); } catch { /* */ } }
process.exit(0);

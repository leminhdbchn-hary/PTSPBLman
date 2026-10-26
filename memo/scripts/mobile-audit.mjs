// Kiểm tra giao diện điện thoại: chụp các màn hình ở 390 px, báo tràn ngang và nút/ô bấm nhỏ hơn 40 px.
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = process.argv[2] || path.join(root, ".e2e-shots/mobile");
fs.mkdirSync(outDir, { recursive: true });
const OUT = path.join(root, "dist-e2e"), APP = "http://127.0.0.1:4319";
if (!process.env.SKIP_BUILD) execSync(`npx vite build --outDir ${OUT} --emptyOutDir`, { cwd: root, env: { ...process.env, VITE_USE_EMULATORS: "1", VITE_FIREBASE_PROJECT_ID: "demo-memo" }, stdio: "ignore" });
const emu = spawn("npx", ["firebase", "emulators:start", "--only", "auth,firestore", "--project", "demo-memo"], { cwd: root, stdio: "ignore", detached: true });
const wait = (u) => new Promise((r) => { const t = () => fetch(u).then(r, () => setTimeout(t, 500)); t(); });
await wait("http://127.0.0.1:8080/"); await wait("http://127.0.0.1:9099/");
await fetch("http://127.0.0.1:8080/emulator/v1/projects/demo-memo/databases/(default)/documents", { method: "DELETE" });
await fetch("http://127.0.0.1:9099/emulator/v1/projects/demo-memo/accounts", { method: "DELETE" });
const server = http.createServer((req, res) => { let f = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname)); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(OUT, "index.html"); res.writeHead(200, { "Content-Type": { ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".html": "text/html; charset=utf-8" }[path.extname(f)] ?? "application/octet-stream" }); fs.createReadStream(f).pipe(res); });
await new Promise((r) => server.listen(4319, "127.0.0.1", r));
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const issues = [];
try {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const check = async (name) => {
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const over = document.documentElement.scrollWidth - vw;
      const wide = [...document.querySelectorAll("body *")].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > vw + 1 && !e.closest("[class*='overflow-x']") && getComputedStyle(e).position !== "fixed"; }).slice(0, 4).map((e) => e.tagName + "." + String(e.className).slice(0, 50));
      const small = [...document.querySelectorAll("a,button,input:not([type=checkbox]):not([type=file]),select,textarea")].filter((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && cs.visibility !== "hidden" && (b.height < 38 || b.width < 38) && !e.closest(".sr-only") && cs.position !== "absolute" && !(e.tagName === "A" && cs.display === "inline"); }).slice(0, 6).map((e) => `${e.tagName} "${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 24)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
      const fs = [...document.querySelectorAll("input,select,textarea")].filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16 && e.getBoundingClientRect().width > 0 && e.type !== "checkbox" && e.type !== "file").length;
      return { over, wide, small, fs };
    });
    if (r.over > 0 || r.wide.length) issues.push(`[${name}] TRÀN NGANG ${r.over}px: ${r.wide.join(", ")}`);
    if (r.small.length) issues.push(`[${name}] ô bấm nhỏ: ${r.small.join(" | ")}`);
    if (r.fs) issues.push(`[${name}] ${r.fs} ô nhập chữ < 16px (iOS sẽ tự phóng to khi bấm vào)`);
    await p.screenshot({ path: path.join(outDir, name + ".png"), fullPage: true });
  };
  await p.goto(APP + "/"); await check("01-trang-chu");
  await p.goto(APP + "/login"); await check("02-dang-nhap");
  await p.goto(APP + "/register"); await p.fill("#fullName", "Lê Minh An"); await p.fill("#email", "an@example.com"); await p.fill("#password", "matkhau123"); await check("03-dang-ky");
  await p.click("button[type=submit]"); await p.waitForURL("**/onboarding"); await check("04-dat-ten-gia-dinh");
  await p.fill("#name", "Gia đình nhà Lê"); await p.click("button[type=submit]"); await p.waitForURL(/\/family$/);
  await p.goto(APP + "/family/manage"); await p.click("button:has-text('Thêm dữ liệu mẫu')"); await p.waitForURL(/\/family\/memories$/, { timeout: 30000 }); await p.waitForSelector("article");
  await check("05-dong-thoi-gian");
  await p.goto(APP + "/family"); await p.waitForSelector("article"); await check("06-tong-quan");
  await p.goto(APP + "/family/album"); await p.waitForSelector("ul li button"); await check("06b-album");
  await p.click("ul li button"); await p.waitForSelector("[role=dialog]"); await p.waitForTimeout(400); await p.screenshot({ path: path.join(outDir, "06c-xem-anh.png") }); await p.keyboard.press("Escape");
  await p.goto(APP + "/family/stories"); await check("06d-loi-ke");
  await p.click("article a"); await p.waitForSelector("h1"); await check("07-chi-tiet-ky-uc");
  await p.goto(APP + "/family/memories/new"); await p.waitForSelector("#title"); await check("08-them-ky-uc");
  await p.goto(APP + "/family/members"); await p.waitForSelector("ul li a"); await check("09-thanh-vien");
  await p.click("ul li a"); await p.waitForSelector("h1"); await check("10-ho-so");
  await p.goto(APP + "/family/members/new"); await p.waitForSelector("#fullName"); await check("11-them-ho-so");
  { const f = await p.evaluate(() => { const c = document.createElement("canvas"); c.width = 600; c.height = 800; const g = c.getContext("2d"); g.fillStyle = "#9db0c8"; g.fillRect(0, 0, 600, 800); g.fillStyle = "#e8c4a0"; g.beginPath(); g.ellipse(300, 330, 130, 170, 0, 0, 7); g.fill(); g.fillStyle = "#333"; g.fillRect(250, 300, 20, 20); g.fillRect(330, 300, 20, 20); return c.toDataURL("image/png").split(",")[1]; });
    await p.setInputFiles("input[aria-label='Chọn ảnh đại diện']", { name: "mat.png", mimeType: "image/png", buffer: Buffer.from(f, "base64") });
    await p.waitForSelector("[data-testid=crop-box] img"); await p.waitForTimeout(400); await check("11b-cat-anh"); await p.click("button:has-text('Huỷ')"); }
  await p.goto(APP + "/family/tree"); await p.waitForSelector("text=Thế hệ thứ 3"); await check("12-gia-pha");
  await p.goto(APP + "/family/manage"); await p.waitForSelector("h2:has-text('Mời người thân')"); await check("13-quan-ly");
  await p.goto(APP + "/settings"); await p.waitForSelector("#fullName"); await check("14-cai-dat");
  await p.goto(APP + "/privacy"); await check("15-chinh-sach");
  await p.goto(APP + "/"); await p.click("summary"); await p.waitForTimeout(300); await p.screenshot({ path: path.join(outDir, "16-menu.png") });
} finally { await b.close(); server.close(); try { process.kill(-emu.pid, "SIGTERM"); } catch { /* */ } }
console.log(issues.length ? issues.join("\n") : "Không phát hiện vấn đề");
process.exit(0);

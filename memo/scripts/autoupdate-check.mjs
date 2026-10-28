// Kiểm tra tự cập nhật: máy chủ đổi tệp JS → khi quay lại tab, trang tự tải lại; đang ở trang soạn thì chờ.
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
import { chromium } from "playwright-core";
const OUT = path.resolve("dist"); let ver = 1;
const srv = http.createServer((q, s) => {
  const u = new URL(q.url, "http://x").pathname; let f = path.join(OUT, u);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(OUT, "index.html");
  let body = fs.readFileSync(f);
  if (f.endsWith("index.html")) body = Buffer.from(body.toString().replace(/(\/assets\/index-[^"]+)\.js/, ver === 1 ? "$1.js" : "$1z.js"));
  s.writeHead(200, { "Content-Type": f.endsWith(".js") ? "text/javascript" : f.endsWith(".css") ? "text/css" : "text/html" }); s.end(body);
});
await new Promise((r) => srv.listen(4325, "127.0.0.1", r));
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage(); let loads = 0; p.on("load", () => loads++);
const fire = () => p.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
await p.goto("http://127.0.0.1:4325/login"); await p.waitForTimeout(800);
await fire(); await p.waitForTimeout(800);
console.log(loads === 1 ? "✔ chưa có bản mới → không tải lại" : "✘ tải lại nhầm", loads);
ver = 2; await fire(); await p.waitForTimeout(1500);
console.log(loads === 2 ? "✔ có bản mới → tự tải lại" : "✘ không tự tải lại", loads);
ver = 1; await p.goto("http://127.0.0.1:4325/family/memories/new"); await p.waitForTimeout(800); const before = loads; ver = 2; await fire(); await p.waitForTimeout(1500);
console.log(loads === before ? "✔ đang soạn ký ức → không tải lại giữa chừng" : "✘ tải lại khi đang soạn", loads);
await b.close(); srv.close();

// Gộp luật Firestore của Nếp Nhà với luật đang dùng của site phòng (cùng một dự án Firebase chỉ có MỘT bộ luật).
// Dùng: node scripts/combine-rules.mjs <luật-site-phòng> <tệp-ra>
import fs from "node:fs";
const [, , deptPath, outPath = "firestore.deploy.rules"] = process.argv;
const nn = fs.readFileSync("firestore.rules", "utf8");
const dept = fs.readFileSync(deptPath, "utf8");
// lấy phần thân bên trong "match /databases/{database}/documents { ... }" của luật site phòng
const start = dept.indexOf("match /databases/{database}/documents {");
if (start < 0) throw new Error("không đọc được luật site phòng");
const bodyStart = start + "match /databases/{database}/documents {".length;
let depth = 1, i = bodyStart;
for (; i < dept.length && depth > 0; i++) { if (dept[i] === "{") depth++; else if (dept[i] === "}") depth--; }
const deptBody = dept.slice(bodyStart, i - 1).trim();
const marker = "    // mọi thứ khác trong dự án: không đụng tới (giữ nguyên các luật riêng của site khác nếu gộp chung)";
if (!nn.includes(marker)) throw new Error("thiếu điểm chèn trong firestore.rules");
const combined = nn.replace(marker, "    // ===== Luật của site Phòng PTSPBL (giữ nguyên, chép từ " + deptPath.split("/").pop() + ") =====\n    " + deptBody.replace(/\n/g, "\n  ").trim() + "\n");
fs.writeFileSync(outPath, "// TỆP SINH TỰ ĐỘNG bởi scripts/combine-rules.mjs — đừng sửa tay.\n" + combined);
console.log("đã ghi", outPath);

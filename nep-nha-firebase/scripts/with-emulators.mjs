// Chạy một lệnh trong khi bật Firebase Emulator (Auth + Firestore) trên máy. Dùng project "demo-*" nên không chạm tới dự án thật.
import { spawnSync } from "node:child_process";
const cmd = process.argv.slice(2).join(" ");
const r = spawnSync("npx", ["firebase", "emulators:exec", "--only", "auth,firestore", "--project", "demo-nepnha", cmd], { stdio: "inherit", shell: false });
process.exit(r.status ?? 1);

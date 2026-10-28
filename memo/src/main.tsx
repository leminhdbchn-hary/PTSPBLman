import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

import { startAutoUpdate } from "./lib/autoUpdate";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

// iOS Safari bỏ qua user-scalable=no: chặn thêm cử chỉ chụm hai ngón để trang đứng yên.
const stop = (e: Event) => e.preventDefault();
document.addEventListener("gesturestart", stop);
document.addEventListener("gesturechange", stop);
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
startAutoUpdate();

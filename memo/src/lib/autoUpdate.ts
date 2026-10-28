// Tự cập nhật: khi có bản web mới (index.html trỏ tới tệp JS khác), tự tải lại — người dùng không cần làm mới trang,
// kể cả khi đã thêm vào màn hình chính iPhone. Chỉ kiểm tra khi mở lại ứng dụng/quay lại tab (và 10 phút/lần khi đang mở).
// Không tải lại giữa chừng lúc đang soạn ký ức hoặc ghi âm: chờ tới khi rời trang đó.
const scriptOf = (html: string) => html.match(/<script[^>]+src="([^"]*\/assets\/[^"]+\.js)"/)?.[1] ?? null;
const BUSY = /\/(new|edit)(\/|$)|\/stories\/new/;

export function startAutoUpdate() {
  if (import.meta.env.DEV || !("fetch" in window)) return;
  const current = scriptOf(document.documentElement.outerHTML) ?? Array.from(document.scripts).map((s) => s.getAttribute("src")).find((s) => s?.includes("/assets/")) ?? null;
  if (!current) return;
  let stale = false, checking = false;

  const reloadIfSafe = () => {
    if (stale && !BUSY.test(location.pathname)) location.reload();
  };
  const check = async () => {
    if (checking || stale) return reloadIfSafe();
    checking = true;
    try {
      const r = await fetch(`/index.html?_=${Date.now()}`, { cache: "no-store" });
      if (!r.ok) return;
      const next = scriptOf(await r.text());
      if (next && next !== current) { stale = true; reloadIfSafe(); }
    } catch { /* offline: bỏ qua */ } finally { checking = false; }
  };

  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") void check(); });
  window.addEventListener("pageshow", (e) => { if (e.persisted) void check(); });
  window.addEventListener("popstate", reloadIfSafe);
  setInterval(() => { if (document.visibilityState === "visible") void check(); }, 10 * 60 * 1000);
  // đổi trang trong ứng dụng (pushState) cũng là lúc an toàn để cập nhật
  const push = history.pushState.bind(history);
  history.pushState = (...a: Parameters<History["pushState"]>) => { push(...a); setTimeout(reloadIfSafe, 0); };
  void check();
}

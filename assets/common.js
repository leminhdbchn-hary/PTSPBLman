/* Dữ liệu + tiện ích dùng chung cho trang chúc 20/10 – Phòng PTSPBL */
var W20 = {
  /* {x} = xưng hô viết thường (chị), {X} = viết hoa (Chị) */
  wishes: [
    "Chúc {x} luôn có số dư nụ cười dương, không bao giờ bị thấu chi hạnh phúc.",
    "Chúc {x} mỗi ngày đi làm là một lần go-live thành công, không cần rollback.",
    "Chúc {x} gửi file một lần là được duyệt, không có câu “{x} xem lại giúp em phần này”.",
    "Chúc {x} lãi suất niềm vui cao hơn mọi kỳ hạn, không cần tất toán trước hạn.",
    "Chúc {x} ít họp, nhiều cà phê, và luôn có chỗ ngồi gần cửa sổ.",
    "Chúc {x} KPI hoàn thành, tâm trạng tăng trưởng, ví tiền cũng tăng trưởng.",
    "Chúc {x} được thương như sản phẩm chủ lực: luôn ưu tiên số một trong mọi roadmap.",
    "Chúc {x} sống chậm như UAT, nhưng thành công như bản chạy chính thức.",
    "Chúc {x} được yêu thương không cần OTP, không hết hạn, không giới hạn hạn mức.",
    "Chúc {x} mỗi sáng thức dậy thấy lịch họp trống và hộp thư đã được ai đó dọn giúp.",
    "Chúc {x} chuyển đổi số mọi thứ, trừ nụ cười: nụ cười cứ để nguyên bản analog.",
    "Chúc {x} hôm nay không phải sửa “lỗi nhỏ thôi” của bất kỳ ai.",
    "Chúc {x} đẹp không cần filter, giỏi không cần “làm nốt tối nay”.",
    "Chúc {x} luôn là phiên bản hạnh phúc nhất: bản cập nhật tự động, không cần cài đặt.",
    "Chúc {x} như Wi-Fi văn phòng: mạnh mẽ, ổn định và ai cũng muốn kết nối.",
    "Chúc {x} mọi tờ trình đều được phê duyệt ngay lần trình đầu tiên.",
    "Chúc {x} nhận thật nhiều lời khen thật lòng, kể cả khi chưa ai cần xin duyệt.",
    "Chúc {x} có nhiều khoảnh khắc “đúng ý” hơn số lần phải “làm lại từ đầu”.",
    "Chúc {x} tin nhắn nào cũng là “ok {x}” và không có chữ “mà…” ở phía sau.",
    "Chúc {x} 20/10 này cười thật tươi, tươi đến mức cả tòa nhà nghe thấy.",
    "Chúc {x} luôn là người ra quyết định cuối cùng… về việc hôm nay ăn gì.",
    "Chúc {x} bug nào cũng tự biến mất trước khi kịp báo cáo.",
    "Chúc {x} năm nào cũng như bản beta: luôn có tính năng mới và vẫn đáng yêu."
  ],
  roles: [
    "Giám đốc Điều hành Nụ Cười",
    "Trưởng nhóm Sản phẩm Xinh Đẹp",
    "Chuyên gia Phát triển Hạnh Phúc Bán Lẻ",
    "Kiến trúc sư Trưởng của Mọi Deadline",
    "Chủ tịch Hội đồng Trà Chiều",
    "Chuyên viên Cao cấp Giải Cứu Báo Cáo",
    "Trưởng phòng Chăm Sóc Đồng Nghiệp",
    "Quản lý Rủi ro Hết Hạnh Phúc (luôn bằng 0)",
    "Product Owner của Mọi Cuộc Vui",
    "Nhà sáng lập Quỹ Ăn Vặt Của Phòng",
    "Giám đốc Trải nghiệm Khách hàng (kể cả đồng nghiệp)",
    "Cố vấn Cấp cao về Cà Phê"
  ],
  perks: [
    ["☕", "Ly cà phê có người pha sẵn"],
    ["😴", "Thêm 1 giờ ngủ (áp dụng cuối tuần, tự nguyện)"],
    ["🛍️", "Quyền mua sắm không cần giải trình"],
    ["🙅", "Thẻ miễn 1 cuộc họp “sync nhanh 15 phút”"],
    ["🎶", "Playlist chill tự bật khi deadline đến gần"],
    ["🍰", "Chiếc bánh không tính calo (hiệu lực đến hết hôm nay)"],
    ["🚀", "Tăng tốc duyệt tờ trình ×10 (trong giấc mơ)"],
    ["💐", "Bó hoa miễn phí, giao tận tay, không cần OTP"]
  ],
  notes: [
    ["✨", "Tính năng mới", "Nụ cười tự động gia hạn, không cần OTP, không giới hạn hạn mức."],
    ["🐞", "Đã sửa lỗi", "Lỗi “chị ơi file này đâu” đã được vá (tạm thời, trong 24 giờ)."],
    ["⚡", "Hiệu năng", "Tốc độ xử lý deadline tăng 200%. Riêng việc pha cà phê được cố tình chậm lại để thưởng thức."],
    ["🔒", "Bảo mật", "Mật khẩu hạnh phúc đã được nâng cấp. Tuyệt đối không chia sẻ cho sếp."],
    ["📈", "Tăng trưởng", "Thị phần trong lòng đồng nghiệp đạt 100%, vượt kế hoạch 20,10%."],
    ["⚠️", "Lưu ý khi cập nhật", "Phiên bản này không hỗ trợ quay về chế độ “ngày thường”."]
  ],
  coupons: [
    ["🎟️", "Miễn 1 cuộc họp “sync nhanh 15 phút”", "(thực tế 45 phút)"],
    ["☕", "Tặng 1 ly cà phê do đồng nghiệp nam trả", "Hạn dùng: hôm nay, tại căng tin gần nhất"],
    ["🧾", "Miễn 1 lần ký “đã xem, đã duyệt” cho tờ trình của người khác", "Áp dụng trong tưởng tượng"],
    ["🕊️", "Được về đúng giờ 1 ngày, không ai nhắn “chị ơi em hỏi chút”", "Không áp dụng cuối quý"],
    ["🍰", "Một miếng bánh ngọt, 0 calo", "Hiệu lực đến hết 20/10"],
    ["👑", "Danh hiệu “Nữ hoàng Của Mọi Báo Cáo” cho cả ngày hôm nay", "Không cần nộp hồ sơ"]
  ],
  pulls: [
    "Máy đang phân tích hồ sơ… kết quả: chị em PTSPBL đạt chuẩn “xuất sắc” ở mọi tiêu chí.",
    "Hệ thống xác nhận: nụ cười của chị em là sản phẩm chưa từng có đối thủ cạnh tranh.",
    "Cảnh báo: phát hiện mức độ đáng yêu vượt ngưỡng cho phép."
  ]
};

function w20Hash(s) {
  var h = 2166136261, i;
  s = String(s || "");
  for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function w20Clean(s, n) { return String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n || 40); }
function w20Wish(i, x) {
  var w = W20.wishes[i % W20.wishes.length];
  var xl = (x || "chị em").toLowerCase();
  return w.replace(/\{x\}/g, xl).replace(/\{X\}/g, xl.charAt(0).toUpperCase() + xl.slice(1));
}
/* Từ tên → chọn chức danh, lời chúc, 3 đặc quyền (luôn cố định cho cùng một tên) */
function w20Derive(name) {
  var h = w20Hash(name.toLowerCase()), p = [], k = 0;
  while (p.length < 3) { var v = w20Hash(name.toLowerCase() + "#" + k++) % W20.perks.length; if (p.indexOf(v) < 0) p.push(v); }
  return { r: h % W20.roles.length, w: (h >>> 8) % W20.wishes.length, p: p };
}
function w20Params() {
  var q = new URLSearchParams(location.search), o = {};
  o.to = w20Clean(q.get("to"), 40);
  o.x = w20Clean(q.get("x"), 8);
  o.f = w20Clean(q.get("f"), 60);
  var r = parseInt(q.get("r"), 10), w = parseInt(q.get("w"), 10);
  o.r = isNaN(r) ? null : Math.abs(r) % W20.roles.length;
  o.w = isNaN(w) ? null : Math.abs(w) % W20.wishes.length;
  var p = (q.get("p") || "").split(".").map(function (v) { return parseInt(v, 10); }).filter(function (v) { return !isNaN(v) && v >= 0 && v < W20.perks.length; });
  o.p = p.length ? p.slice(0, 3) : null;
  return o;
}
function w20Link(base, o) {
  var q = [];
  function add(k, v) { if (v !== null && v !== undefined && v !== "") q.push(k + "=" + encodeURIComponent(v)); }
  add("to", o.to); add("x", o.x); add("f", o.f); add("r", o.r); add("w", o.w); add("p", o.p && o.p.join("."));
  return base + (q.length ? "?" + q.join("&") : "");
}

/* ===== Hiệu ứng: cánh hoa rơi + pháo giấy ===== */
var FX = (function () {
  var cv, ctx, W, H, parts = [], petals = [], raf = 0, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EM = ["🌸", "🌷", "🌹", "💐", "🌺"], COL = ["#ffd76a", "#ff4f9a", "#ffffff", "#7cf0b0", "#ffa94d", "#a78bfa"];
  function size() { var d = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(d, 0, 0, d, 0, 0); }
  function mkPetal(top) { return { x: Math.random() * W, y: top ? -20 : Math.random() * H, s: 14 + Math.random() * 16, vy: .5 + Math.random() * 1.1, vx: (Math.random() - .5) * .6, ph: Math.random() * 6, e: EM[(Math.random() * EM.length) | 0], r: Math.random() * 6 }; }
  function init() {
    cv = document.getElementById("fx"); if (!cv) return; ctx = cv.getContext("2d"); size(); addEventListener("resize", size);
    var n = reduce ? 6 : Math.min(18, Math.round(W / 22)); for (var i = 0; i < n; i++) petals.push(mkPetal(false));
    loop();
  }
  function loop() {
    ctx.clearRect(0, 0, W, H);
    var i, p;
    for (i = 0; i < petals.length; i++) {
      p = petals[i]; p.y += p.vy; p.ph += .02; p.x += p.vx + Math.sin(p.ph) * .5; p.r += .01;
      if (p.y > H + 30) petals[i] = mkPetal(true);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.r) * .6); ctx.globalAlpha = .55; ctx.font = p.s + "px serif"; ctx.fillText(p.e, 0, 0); ctx.restore();
    }
    for (i = parts.length - 1; i >= 0; i--) {
      p = parts[i]; p.vy += .12; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.l -= 1; p.a += p.va;
      if (p.l <= 0 || p.y > H + 20) { parts.splice(i, 1); continue; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = Math.min(1, p.l / 30); ctx.fillStyle = p.c;
      if (p.t) { ctx.font = p.s + "px serif"; ctx.fillText(p.t, 0, 0); } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    raf = requestAnimationFrame(loop);
  }
  function burst(x, y, n) {
    if (!cv) return; n = reduce ? Math.min(n || 40, 14) : (n || 60);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, v = 3 + Math.random() * 7, fl = Math.random() < .18;
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, s: fl ? 20 : 7 + Math.random() * 7, c: COL[(Math.random() * COL.length) | 0], t: fl ? EM[(Math.random() * EM.length) | 0] : null, l: 90 + Math.random() * 60, a: Math.random() * 6, va: (Math.random() - .5) * .3 });
    }
  }
  function rain() { for (var i = 0; i < 5; i++) setTimeout(function () { burst(Math.random() * W, H * (.2 + Math.random() * .3), 50); }, i * 260); }
  return { init: init, burst: burst, rain: rain };
})();

function w20Wrap(ctx, text, maxW) {
  var words = text.split(" "), lines = [], cur = "", i, t;
  for (i = 0; i < words.length; i++) { t = cur ? cur + " " + words[i] : words[i]; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = words[i]; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function w20Copy(text, done) {
  function fb() { var t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0"; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} t.remove(); done && done(); }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done && done(); }, fb); else fb();
}

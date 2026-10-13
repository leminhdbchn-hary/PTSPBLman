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

/* ===== Hiệu ứng: cánh hoa rơi + pháo giấy =====
   Tối ưu cho máy yếu: emoji vẽ sẵn thành hình nhỏ (sprite) một lần, không vẽ chữ mỗi khung hình;
   tự giảm chất lượng nếu thấy giật; có nút "Chế độ nhẹ" (hoặc ?lite=1). */
var FX = (function () {
  var cv, ctx, W, H, parts = [], petals = [], raf = 0, tick = 0, last = 0, slow = 0, SP = {}, lite = false, btn;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EM = ["🌸", "🌷", "🌹", "💐", "🌺"], COL = ["#ffd76a", "#ff4f9a", "#ffffff", "#7cf0b0", "#ffa94d", "#a78bfa"];
  function store(v) { try { if (v === undefined) return localStorage.getItem("w20lite"); localStorage.setItem("w20lite", v ? "1" : "0"); } catch (e) {} }
  function weak() { return (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4); }
  function sprites() {
    EM.forEach(function (e) { var c = document.createElement("canvas"); c.width = c.height = 64; var g = c.getContext("2d"); g.font = "48px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e, 32, 36); SP[e] = c; });
  }
  function size() { var d = lite ? 1 : Math.min(window.devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; cv.style.width = W + "px"; cv.style.height = H + "px"; ctx.setTransform(d, 0, 0, d, 0, 0); }
  function mkPetal(top) { return { x: Math.random() * W, y: top ? -20 : Math.random() * H, s: 16 + Math.random() * 14, vy: .5 + Math.random() * 1.1, vx: (Math.random() - .5) * .6, ph: Math.random() * 6, e: EM[(Math.random() * EM.length) | 0] }; }
  function fill() { petals = []; var n = reduce ? 4 : lite ? 5 : Math.min(14, Math.round(W / 40)); for (var i = 0; i < n; i++) petals.push(mkPetal(false)); }
  function setLite(v, save) {
    lite = !!v; document.documentElement.classList.toggle("lite", lite); if (save !== false) store(lite);
    if (cv) { size(); fill(); parts.length = Math.min(parts.length, 30); }
    if (btn) btn.textContent = lite ? "⚡ Chế độ nhẹ: BẬT" : "⚡ Chế độ nhẹ";
  }
  function init() {
    cv = document.getElementById("fx"); if (!cv) return; ctx = cv.getContext("2d", { alpha: true }); sprites();
    var q = /[?&]lite=1/.test(location.search), st = store();
    lite = q || st === "1" || (st === null && weak());
    document.documentElement.classList.toggle("lite", lite);
    size(); fill(); addEventListener("resize", function () { size(); });
    btn = document.createElement("button"); btn.type = "button"; btn.className = "litebtn"; btn.setAttribute("aria-label", "Bật tắt chế độ nhẹ cho máy yếu");
    btn.textContent = lite ? "⚡ Chế độ nhẹ: BẬT" : "⚡ Chế độ nhẹ"; btn.onclick = function () { setLite(!lite); };
    document.body.appendChild(btn);
    document.addEventListener("visibilitychange", function () { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { last = 0; raf = requestAnimationFrame(loop); } });
    raf = requestAnimationFrame(loop);
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    tick++; if (lite && (tick & 1)) return; /* chế độ nhẹ: chạy 30 khung/giây */
    var dt = last ? now - last : 16; last = now;
    if (!lite && dt > 40) { slow++; if (slow > 40) { setLite(true); slow = 0; } } else if (slow > 0) slow -= .5; /* tự giảm chất lượng nếu giật liên tục */
    ctx.clearRect(0, 0, W, H);
    var i, p, k = lite ? 2 : 1;
    ctx.globalAlpha = .55;
    for (i = 0; i < petals.length; i++) {
      p = petals[i]; p.y += p.vy * k; p.ph += .02 * k; p.x += (p.vx + Math.sin(p.ph) * .5) * k;
      if (p.y > H + 30) petals[i] = mkPetal(true);
      ctx.drawImage(SP[p.e], p.x, p.y, p.s, p.s);
    }
    for (i = parts.length - 1; i >= 0; i--) {
      p = parts[i]; p.vy += .12 * k; p.x += p.vx * k; p.y += p.vy * k; p.vx *= .99; p.l -= k;
      if (p.l <= 0 || p.y > H + 20) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.l / 30);
      if (p.t) ctx.drawImage(SP[p.t], p.x, p.y, p.s, p.s);
      else { ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s * .5); }
    }
    ctx.globalAlpha = 1;
  }
  function burst(x, y, n) {
    if (!cv) return; n = n || 60; n = reduce ? Math.min(n, 14) : lite ? Math.min(n, 26) : Math.min(n, 90);
    if (parts.length > 160) return;
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, v = 3 + Math.random() * 7, fl = Math.random() < .18;
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, s: fl ? 22 : 7 + Math.random() * 7, c: COL[(Math.random() * COL.length) | 0], t: fl ? EM[(Math.random() * EM.length) | 0] : null, l: 80 + Math.random() * 50 });
    }
  }
  function rain() { var m = lite ? 2 : 4; for (var i = 0; i < m; i++) setTimeout(function () { burst(Math.random() * W, H * (.2 + Math.random() * .3), 40); }, i * 300); }
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

/* ===== Dữ liệu bản dành cho các Sếp (anh em Nam chúc Sếp) ===== */
W20.sep = {
  wishes: [
    "Anh em chúc {x} 20/10 thật rực rỡ, và hứa hôm nay không gửi email nào có chữ “gấp”.",
    "Chúc {x} mọi tờ trình đều được duyệt ngay lần đầu, ở cả hai chiều.",
    "Cảm ơn {x} đã kiên nhẫn với những lần anh em xin thêm 5 phút nữa.",
    "Chúc {x} nụ cười luôn tươi hơn mọi chỉ tiêu và vững hơn mọi kế hoạch.",
    "Chúc {x} một ngày không họp, nhiều hoa, và có anh em pha sẵn cà phê.",
    "Anh em xin gửi {x} lời chúc chân thành nhất, kèm cam kết nghiêm túc nhất: hôm nay sẽ tử tế hơn mọi ngày.",
    "Chúc {x} luôn được quý trọng như sản phẩm chủ lực của cả khối.",
    "Có {x}, cả phòng có phương hướng. Hôm nay anh em xin có hoa.",
    "Chúc {x} sức khỏe dồi dào để tiếp tục “góp ý” cho anh em, chúng em sẽ cố tiếp thu.",
    "Chúc {x} mọi quyết định đều đúng, mọi cuộc họp đều ngắn, mọi nụ cười đều thật.",
    "Cảm ơn {x} đã là chỗ dựa vững chắc, dù đôi khi anh em làm {x} đau đầu.",
    "Chúc {x} 20/10 này thật nhiều niềm vui, và thật ít… email “chị xem giúp em”."
  ],
  roles: [
    "Thuyền trưởng Kiên Nhẫn của Con Tàu PTSPBL",
    "Tổng chỉ huy Mọi Cuộc Họp (luôn đúng giờ)",
    "Người Thắp Lửa Của Cả Phòng",
    "Chủ tịch Danh dự Hội đồng Duyệt Tờ Trình Nhanh",
    "Nữ Hoàng Của Những Lời Góp Ý Chuẩn Xác",
    "Bộ Não Chiến Lược kiêm Trưởng Ban Tinh Thần",
    "Sếp 5 Sao Không Cần Đánh Giá"
  ],
  traits: [
    "Tốc độ duyệt tờ trình: nhanh như chớp (khi anh em gửi đủ hồ sơ)",
    "Khả năng phát hiện lỗi chính tả: không cần kính lúp",
    "Độ kiên nhẫn: vô hạn (đã được kiểm chứng nhiều lần)",
    "Kỹ năng họp: luôn biết lúc nào nên kết thúc cuộc họp",
    "Khả năng đoán anh em đang nghĩ gì: chính xác 100%",
    "Nụ cười: không cần giải trình",
    "Gu cà phê: khó, nhưng anh em đang học",
    "Tầm nhìn chiến lược: xa hơn deadline anh em tự đặt",
    "Độ tin cậy: cao hơn mọi mức xếp hạng tín nhiệm",
    "Sức lan tỏa: cả phòng đều bị lây tinh thần",
    "Hạn mức quan tâm dành cho anh em: không giới hạn",
    "Khả năng nhìn ra giải pháp: nhanh hơn khả năng anh em tìm ra vấn đề"
  ],
  pledges: [
    "Anh em cam kết gửi báo cáo trước deadline… ít nhất một lần trong năm.",
    "Anh em cam kết không nhắn “Sếp ơi gấp ạ” vào cuối giờ.",
    "Anh em cam kết nhớ món cà phê của Sếp, kể cả khi Sếp đổi ý.",
    "Anh em cam kết luôn nói “cảm ơn” khi được góp ý (nói thật lòng).",
    "Anh em cam kết tặng hoa đúng ngày, không để Sếp phải nhắc.",
    "Anh em cam kết đọc kỹ tờ trình trước khi trình (nỗ lực tối đa)."
  ],
  orders: [
    "Hôm nay mọi việc đều có thể chờ đến mai, trừ việc cười.",
    "Giao anh em pha cà phê đến hết ngày. Chất lượng: theo cảm xúc.",
    "Mỗi người khen Sếp ít nhất 3 câu, có minh chứng cụ thể.",
    "Cấm họp “sync nhanh”. Thay bằng “ăn nhanh”.",
    "Cuối giờ anh em tự dọn phòng họp. Sếp ở lại ngắm hoa.",
    "Mọi email hôm nay phải bắt đầu bằng hai chữ “Chúc mừng”.",
    "Tạm dừng toàn bộ deadline đến 17h30, nếu không ai phát hiện.",
    "Hôm nay Sếp luôn đúng. Ngày mai sẽ xem xét lại.",
    "Quà tặng Sếp phải là hoa tươi, không được là tờ trình.",
    "Anh em xếp hàng chúc mừng theo thứ tự ai nhanh chân nhất.",
    "Chủ đề cuộc họp ngày mai: “Cách để Sếp được thương nhiều hơn”.",
    "Ai quên ngày 20/10 phải làm 10 chiếc bánh… tưởng tượng."
  ]
};
function w20DeriveSep(name) {
  var k = name.toLowerCase(), h = w20Hash(k), t = [], i = 0;
  while (t.length < 5) { var v = w20Hash(k + "#" + i++) % W20.sep.traits.length; if (t.indexOf(v) < 0) t.push(v); }
  return { r: h % W20.sep.roles.length, w: (h >>> 8) % W20.sep.wishes.length, t: t };
}
function w20SepWish(i, x) {
  var w = W20.sep.wishes[i % W20.sep.wishes.length], xl = (x || "Sếp").toLowerCase();
  return w.replace(/\{x\}/g, xl).replace(/\{X\}/g, xl.charAt(0).toUpperCase() + xl.slice(1));
}

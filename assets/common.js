/* Dữ liệu + tiện ích dùng chung cho trang chúc 20/10 – Phòng PTSPBL */
var W20 = {
  /* {x} = xưng hô viết thường (chị), {X} = viết hoa (Chị) */
  wishes: [
    "Chúc {x} 20/10 được tặng hoa nhiều tới mức phải nhờ anh em bê hộ về nhà.",
    "Chúc {x} lúc nào cũng xinh, cười thật nhiều, còn deadline thì cứ từ từ hẵng tới.",
    "Chúc {x} gửi file một lần là sếp duyệt luôn, không có vòng hai vòng ba gì hết.",
    "Chúc {x} sáng nào đi làm cũng có chỗ đỗ xe, trưa nào cũng có món ngon, chiều nào cũng về đúng giờ.",
    "Chúc {x} hôm nay khỏi phải làm gì, chỉ cần ngồi xinh cho anh em ngắm thôi.",
    "Chúc {x} lúc nào cũng vui như ngày nhận lương, và bình tĩnh như hôm hệ thống chạy ngon lành.",
    "Chúc {x} ăn hoài không béo, tiêu hoài không hết, còn họp hoài thì… thôi khỏi họp.",
    "Chúc {x} mọi việc trôi chảy như chuyển khoản nội bộ: nhanh, gọn, không mất phí.",
    "Chúc {x} 20/10 nhận được thật nhiều lời khen thật lòng, kèm một cốc trà sữa full topping.",
    "Chúc {x} nụ cười lúc nào cũng tươi, dù cuối tháng có phải chạy số tới đâu.",
    "Chúc {x} thật khỏe, thật vui, và thật ít tin nhắn mở đầu bằng “chị ơi gấp”.",
    "Chúc {x} luôn được thương như ngày đầu về Phòng, và được chiều như ngày 20/10.",
    "Chúc sản phẩm nào {x} làm ra cũng được khách khen, còn {x} thì được cả Phòng khen.",
    "Chúc {x} ngày nào cũng đẹp trời, kể cả hôm phải làm báo cáo quý.",
    "Chúc {x} lúc nào cũng có người pha cà phê, có người đặt cơm, có người làm hộ slide.",
    "Chúc {x} xinh vừa đủ để cả Phòng mê, giỏi vừa đủ để sếp tin, vui thật nhiều để anh em đỡ sợ.",
    "Chúc {x} 20/10 thật ngọt ngào, ngọt hơn cả miếng bánh anh em mang tới.",
    "Chúc {x} cứ thong thả mà xinh, việc khó đã có anh em lo (lo được tới đâu hay tới đó).",
    "Chúc {x} tờ trình nào cũng qua, ý tưởng nào cũng được khen, và lương thì cứ đều đều mà tăng.",
    "Chúc {x} một ngày 20/10 rộn ràng: sáng nhận hoa, trưa nhận quà, chiều nhận… lời khen của anh em."
  ],
  roles: [
    "Hoa khôi Phòng PTSPBL (do anh em tự bầu)",
    "Giám đốc Điều hành Nụ Cười",
    "Chuyên gia Gỡ Rối Mọi Báo Cáo",
    "Nữ hoàng Deadline",
    "Chủ tịch Hội Trà Chiều",
    "Người giữ lửa của Phòng",
    "Trưởng ban Ăn Vặt",
    "Phù thủy Excel",
    "Đệ nhất Pha Trò Lúc Mệt",
    "Bộ não của mọi ý tưởng sản phẩm",
    "Đại sứ Thân thiện của Phòng",
    "Cố vấn Cấp cao về Trà Sữa"
  ],
  perks: [
    ["☕", "Cốc cà phê có người pha sẵn"],
    ["😴", "Thêm 1 tiếng ngủ nướng cuối tuần"],
    ["🛍️", "Quyền mua sắm không phải giải trình"],
    ["🙅", "Thẻ miễn 1 cuộc họp"],
    ["🎶", "Playlist chill tự bật mỗi khi gần deadline"],
    ["🍰", "Bánh ngọt không tính calo (hiệu lực đến hết 20/10)"],
    ["🚀", "Tờ trình nào cũng được duyệt ngay lần đầu"],
    ["💐", "Hoa tươi giao tận bàn, không cần đặt trước"]
  ],
  notes: [
    ["✨", "Tính năng mới", "Nụ cười của chị em giờ tự gia hạn, không cần OTP, không giới hạn hạn mức."],
    ["🐞", "Đã sửa lỗi", "Lỗi “chị ơi file này để đâu” đã được vá. Hiệu lực trong 24 giờ, sau đó… tính tiếp."],
    ["⚡", "Tăng tốc", "Xử lý deadline nhanh gấp đôi. Riêng khoản pha cà phê được cố ý làm chậm để còn thưởng thức."],
    ["🔒", "Bảo mật", "Bí kíp giữ dáng, giữ lương, giữ bình tĩnh của chị em được mã hóa tuyệt đối. Sếp cũng không xem được."],
    ["📈", "Tăng trưởng", "Thị phần trong lòng anh em: 100%, vượt kế hoạch 20,10%."],
    ["⚠️", "Lưu ý", "Bản này không quay về chế độ “ngày thường” được. Hôm nay cứ được chiều thôi."]
  ],
  coupons: [
    ["🎟️", "Miễn 1 cuộc họp", "Dùng lúc nào tùy chị"],
    ["☕", "1 cốc cà phê, anh em trả tiền", "Hạn dùng: hôm nay"],
    ["🕊️", "1 buổi về đúng giờ, không ai nhắn “chị ơi em hỏi chút”", "Không áp dụng cuối quý"],
    ["🍰", "1 miếng bánh ngọt 0 calo", "Hiệu lực đến hết 20/10"],
    ["👑", "Danh hiệu “Nữ hoàng của Phòng” cả ngày hôm nay", "Không cần nộp hồ sơ"],
    ["🤝", "Anh em làm hộ 1 việc vặt", "Trong giờ hành chính nha"]
  ],
  pulls: [
    "Máy vừa soi hồ sơ: chị em PTSPBL đạt loại “xuất sắc” ở mọi tiêu chí, kể cả tiêu chí xinh.",
    "Cảnh báo nhẹ: mức độ đáng yêu đang vượt ngưỡng cho phép. Anh em xin phép không xử lý.",
    "Hệ thống xác nhận: nụ cười của chị em là sản phẩm chưa có đối thủ cạnh tranh."
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
  o.u = w20Clean(q.get("u"), 12);
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
    "Chị Cả 5 Sao Không Cần Đánh Giá"
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

/* ===== Danh sách người nhận (assets/people.js) và chia quà ===== */
function w20Person(id) { if (!id || typeof W20P === "undefined") return null; for (var i = 0; i < W20P.length; i++) if (W20P[i].id === id) return W20P[i]; return null; }
function w20Short(n) { var a = String(n || "").trim().split(/\s+/); return a[a.length - 1] || ""; }
function w20Fold(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase(); }
/* Chia quà ngẫu nhiên nhưng cố định: mỗi người 2 món KHÁC NHAU, theo số lượng ở assets/stock.js (tổng = 2 × số người).
   Không ai chọn sẵn: thứ tự do "seed" xáo trộn. Cùng dữ liệu luôn cho cùng kết quả, nên quay ở máy nào cũng ra đúng 2 món đã chia.
   stock (không bắt buộc) = { qty: [...], seed } để thử số lượng khác ở trang admin. Trả về { id: [món1, món2] }. */
function w20Assign(stock) {
  stock = stock || (typeof W20STOCK !== "undefined" ? W20STOCK : {});
  var P = W20CFG.prizes, ppl = (typeof W20P === "undefined" ? [] : W20P).slice(), n = ppl.length, seed = String(stock.seed || "2010"), i, j, k;
  ppl.sort(function (a, b) { return w20Hash(a.id + "|" + seed) - w20Hash(b.id + "|" + seed); });
  var q = P.map(function (p, x) { return Math.max(0, Math.min(n, parseInt((stock.qty || [])[x], 10) || 0)); }), tot = q.reduce(function (a, b) { return a + b; }, 0), need = 2 * n;
  if (tot < need) { var rest = need - tot, guard = 0; for (k = 0; rest > 0 && guard < 5000; k = (k + 1) % P.length, guard++) if (q[k] < n) { q[k]++; rest--; } }
  var slots = [], used = P.map(function () { return 0; });
  while (slots.length < need) { var moved = false; for (i = 0; i < P.length && slots.length < need; i++) if (used[i] < q[i]) { used[i]++; slots.push(i); moved = true; } if (!moved) break; }
  while (slots.length < need) slots.push(slots.length % P.length);
  /* xáo các suất theo seed rồi chia cặp, đảm bảo 2 món của mỗi người khác nhau */
  slots.sort(function (a, b) { return 0; });
  var pool = slots.slice(), rnd = function (x) { return w20Hash(seed + "#" + x); };
  for (i = pool.length - 1; i > 0; i--) { j = rnd(i) % (i + 1); var t0 = pool[i]; pool[i] = pool[j]; pool[j] = t0; }
  var A = pool.slice(0, n), B = pool.slice(n, 2 * n);
  for (i = 0; i < n; i++) if (A[i] === B[i]) {
    for (j = 0; j < n; j++) { var jj = (i + 1 + j) % n; if (B[jj] !== A[i] && B[i] !== A[jj]) { var t = B[i]; B[i] = B[jj]; B[jj] = t; break; } } }
  var out = {}; for (i = 0; i < n; i++) out[ppl[i].id] = [A[i], B[i]];
  return out;
}

/* Dữ liệu + tiện ích dùng chung cho trang chúc 20/10 – Phòng PTSPBL */
var W20 = {
  /* {x} = xưng hô viết thường (chị), {X} = viết hoa (Chị) */
  wishes: [
    "Nhân dịp 20/10, Chúc {x} nhận được nhiều hoa, nhiều quà tới mức phải nhờ anh em Ship hộ về nhà.",
    "Chúc {x} lúc nào cũng xinh đẹp, cười thật nhiều lên nhé.",
    "Chúc {x} gửi tờ trình là sếp duyệt luôn, không cần giải trình không cần chứng minh. Bút phê tư duy sáng suốt tuyệt đối điện ảnh!",
    "Chúc {x} sáng nào cũng happy hour, trưa nào cũng ngủ đủ giấc, chiều nào cũng về đúng giờ.",
    "Chúc {x} hôm nay khỏi phải làm gì, chỉ cần ngồi xinh cho anh em ngắm thôi.",
    "Chúc {x} ngày nào cũng vui như ngày nhận thưởng, tâm hồn luôn an nhiên như lúc đọc ý kiến của TGĐ",
    "Chúc {x} ăn nhiều không béo, tiêu mãi không hết tiền",
    "Chúc {x} viết sản phẩm trôi như nước chảy",
    "Chúc {x} 20/10 nhận được thật nhiều lời khen, lời chúc",
    "Chúc mừng Ngày Phụ nữ Việt Nam 20/10! Chúc {x} luôn tự tin, duyên dáng và tỏa sáng theo cách riêng của mình.",
    "Chúc {x} thật khỏe, thật vui, và thật ít tin nhắn mở đầu bằng “{x} ơi gấp gấp”.",
    "Chúc {x} luôn “việc nhà thì đảm, việc cơ quan thì tài”, ngày càng trẻ đẹp và hạnh phúc",
    "Chúc sản phẩm nào {x} làm ra cũng là ngôi sao",
    "Chúc {x} ngày nào cũng đẹp trời, kể cả hôm phải làm báo cáo quý.",
    "Chúc {x} lúc nào cũng có người Order cà phê, có người đặt cơm, có người làm hộ slide.",
    "Chúc {x} xinh vừa đủ để cả Phòng mê, giỏi vừa đủ để sếp tin, vui thật nhiều để anh em đỡ sợ.",
    "Chúc {x} 20/10 thật ngọt ngào, vui vẻ và hạnh phúc",
    "Chúc {x} cứ thong thả mà xinh, việc khó đã có anh em lo (lo được tới đâu hay tới đó).",
    "Chúc {x} tờ trình nào cũng qua, ý tưởng nào cũng được khen, và lương thì cứ đều đều mà tăng.",
    "Chúc {x} một ngày 20/10 rộn ràng: sáng nhận hoa, trưa nhận quà, cả ngày… lời khen của anh em."
  ],
  roles: [
    "Hoa khôi Phòng PTSPBL (do anh em tự bầu)",
    "Trưởng phòng Cười",
    "Chuyên gia Slideee",
    "Nữ hoàng Cây BI AI",
    "Chủ tịch Hội Trà Chiều",
    "Người tắt đèn đi ngủ 12h30",
    "Nữ Hoàng ăn vặt",
    "Phù thủy Excel",
    "Thánh diệt mồi",
    "Bộ não của mọi ý tưởng sản phẩm",
    "Đại sứ Thân thiện của Phòng",
    "Cố vấn Cấp cao về Trà Sữa",
    "Cố vấn cao cấp về Sản phẩm"
  ],
  perks: [
    ["☕", "Có 1 ae trực nhật hộ 1 hôm"],
    ["😴", "Ngủ trưa thêm 15 phút có anh em bảo kê"],
    ["🛍️", "Quyền được 1 ae bóp vai (nếu cần)"],
    ["🙅", "Quyền được 1 ae bóp đầu (nếu cần)"],
    ["🎶", "Nhờ ae thay bình nước 1 lần"],
    ["🍰", "Nhờ ae xuống lấy ship 1 lần"],
    ["🚀", "Nhờ ae pha cà phê 1 lần"],
    ["💐", "Nhờ xuống lấy đồ ăn 1 lần"]
  ],
  notes: [
    ["✨", "Xinh đẹp không cần điều kiện", "Chị em chính thức được kích hoạt chế độ xinh đẹp, rạng rỡ và tràn đầy năng lượng. Không cần OTP, không cần phê duyệt, hiệu lực suốt ngày 20/10."],
    ["🐞", "Chốt bản cuối trong một nốt nhạc", "Đã xử lý lỗi phát sinh khi bản cuối có thêm bản cuối 2, bản cuối chốt và bản cuối chốt thật."],
    ["🔒", "Tiếp nhận góp ý, không tiếp nhận áp lực", "Tự động kích hoạt bộ lọc bình tĩnh khi nhận góp ý từ các đơn vị, chi nhánh và những pha “bổ sung thêm một ý nhỏ”. Tâm thế vững vàng, nụ cười luôn trực tuyến."],
    ["📈", "Lãi suất yêu thương luôn ở mức ưu đãi nhất", "Đặc quyền gồm: miễn phí nhận lời khen, giảm 100% áp lực không đáng có, hoàn tiền bằng những nụ cười và ưu đãi không giới hạn sự quan tâm."]
  ],
  coupons: [
    ["🎟️", "Miễn 1 cuộc họp", "Dùng lúc nào tùy chị"],
    ["😴", "Ngủ trưa thêm 15 phút, có anh em bảo kê", "Anh em canh cửa giúp chị"],
    ["💆", "Được 1 ae bóp vai 1 lần (nếu cần)", "Dùng khi chị mỏi vai"],
    ["🧹", "1 ae trực nhật hộ chị 1 hôm", "Chị cứ để đó, anh em lo"],
    ["🚰", "Nhờ ae thay bình nước 1 lần", "Bình nặng để anh em"],
    ["📦", "Nhờ ae xuống lấy đồ ship 1 lần", "Chị ngồi đó, anh em xuống"]
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
    "Anh em PTSPBL chúc {X} ngày 20/10 thật rạng rỡ, nhiều niềm vui và tạm thời không có email nào có tiêu đề “GẤP” ạ!",
    "Chúc {X} luôn gặp những tờ trình chỉ cần đọc một lần là duyệt, những phương án vừa trình đã thông qua và những kế hoạch triển khai thuận lợi từ đầu đến cuối.",
    "Cảm ơn {x} đã kiên nhẫn với những lần anh em xin thêm 5 phút nữa.",
    "Chúc {X} luôn tươi trẻ, nhiều năng lượng, niềm vui tăng trưởng vượt kế hoạch và mọi áp lực đều được kiểm soát trong ngưỡng an toàn.",
    "Chúc {X} một ngày 20/10 ngập tràn hoa, quà và lời chúc; lịch họp thưa hơn và không có việc phát sinh ngoài kế hoạch ạ.",
    "Anh em xin gửi {x} lời chúc chân thành nhất, kèm cam kết nghiêm túc hoàn thành công việc được giao :D",
    "Chúc {X} luôn là “sản phẩm chủ lực” được yêu mến nhất, có sức khỏe dồi dào, tinh thần vững vàng và nhận được thật nhiều sự đồng hành từ cả Phòng.",
    "Cảm ơn {X} đã luôn là điểm tựa vững chắc của anh em PTSPBL. Chúc luôn mạnh khỏe, nhiều niềm vui và tiếp tục dẫn dắt Phòng mình chinh phục những mục tiêu mới",
    "Chúc {x} sức khỏe dồi dào để tiếp tục “góp ý” cho anh em, chúng em sẽ cố tiếp thu.",
    "Chúc mọi phương án đều khả thi, mọi tờ trình đều thuận lợi, mọi kế hoạch đều vượt chỉ tiêu và mọi ngày làm việc đều có thật nhiều niềm vui. Riêng hôm nay, KPI ưu tiên là nhận hoa và lời chúc ạ",
    "Cảm ơn {X} đã là chỗ dựa vững chắc, dù đôi khi anh em làm {X} hơi đau đầu.",
    "Chúc {x} 20/10 này thật nhiều niềm vui, và thật ít… email “chị xem giúp em GẤP ạ”."
  ],
  roles: [
    "Lãnh tụ Kiên Nhẫn",
    "Đại sứ Đúng Giờ – Họp Là Có Mặt",
    "Ngọn Hải Đăng Truyền Lửa PTSPBL",
    "Bàn Tay Vàng Phê Duyệt – Tờ Trình Không Chờ Đợi",
    "Nữ Hoàng Góp Ý – Một Câu Trúng Đích",
    "Nữ Hoàng Đa Nhiệm – Việc Gì Cũng Cân",
    "Nàng Thơ PTSPBL – Tài Sắc Vẹn Toàn",
    "Bông Hoa Thép – Dịu Dàng Mà Bản Lĩnh"
  ],
  traits: [
    "Tốc độ duyệt tờ trình: Nhanh như chớp, miễn là hồ sơ không chơi trò trốn tìm",
    "Radar soi lỗi: Chính tả có thể qua mắt cả phòng, nhưng khó qua mắt sếp",
    "Độ kiên nhẫn: Bình tĩnh trước mọi tình huống, kể cả khi anh em hỏi lại lần thứ n",
    "Chỉ số đáng tin cậy: Có sếp ở đây, anh em yên tâm thêm một nửa.",
    "Khả năng đọc vị đồng đội: Anh em chưa kịp nói, sếp đã hiểu được ba phần tư câu chuyện",
    "Năng lực kiểm soát tình hình: Bề ngoài bình yên, bên trong đã tính đủ năm phương án.",
    "Bộ lọc chất lượng: Việc qua tay sếp, chỉn chu thêm vài phần",
    "Tầm nhìn chiến lược: Nhìn xa hơn deadline, nghĩ trước một bước, tính trước vài đường",
    "Kỹ năng giao nhiệm vụ: Sếp nói một câu, anh em có thêm ba đầu việc.",
    "Độ phủ năng lượng: Sếp vui một chút, cả phòng có động lực cả ngày",
    "Khả năng xử lý việc gấp: Deadline càng sát, thần thái càng vững.",
    "Siêu năng lực đa nhiệm: Một lúc xử lý nhiều việc, vẫn giữ phong thái bình tĩnh"
  ],
  pledges: [
    "Anh em cam kết gửi báo cáo trước deadline... ít nhất là trước khi Sếp kịp nhắn tin lần 2.",
    "Anh em cam kết không nhắn “Sếp ơi gấp ạ” vào cuối giờ.",
    "Anh em cam kết đi họp đúng giờ, không để tình trạng “Em đang on the way” kéo dài quá 5 phút.",
    "Anh em cam kết nở nụ cười tươi và nói “Em cảm ơn Sếp” khi nhận Comment dài 3 trang A4.",
    "Anh em cam kết đọc kỹ tờ trình trước khi trình (nỗ lực tối đa)."
  ],
  orders: [
    "Hôm nay việc gì cũng để mai được, riêng nụ cười thì phải có ngay từ sáng.",
    "Mỗi người khen Sếp ít nhất 3 câu, phải kể được ví dụ thật. Khen kiểu “Sếp đẹp quá” mà không có lý do thì bị trừ điểm.",
    "Hôm nay cấm gửi file “final_final_v3”. Ai lỡ gửi phải tặng Sếp một bông hoa.",
    "Mọi email hôm nay phải mở đầu bằng “Chúc mừng 20/10”, kể cả email xin nghỉ phép nghỉ",
    "Deadline tạm nghỉ đến 17h30. Ai lỡ nhắc đến chữ “deadline” thì mời cả phòng cà phê",
    "Hôm nay Sếp luôn đúng. Ngày mai sẽ xem xét lại.",
    "Ai kéo dài cuộc họp quá 30 phút phải hát tặng Sếp một bài, hát sai nhạc thì hát lại."
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
function w20Person(id) { if (!id || typeof W20P === "undefined") return null; var i; for (i = 0; i < W20P.length; i++) if (W20P[i].id === id) return W20P[i]; if (typeof W20TEST !== "undefined") for (i = 0; i < W20TEST.length; i++) if (W20TEST[i].id === id) return W20TEST[i]; return null; }
function w20Short(n) { var a = String(n || "").trim().split(/\s+/); return a[a.length - 1] || ""; }
function w20Fold(s) { return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase(); }
/* Chia quà ngẫu nhiên nhưng cố định: mỗi người 1 món, theo số lượng ở assets/stock.js (tổng = số người).
   Không ai chọn sẵn: thứ tự do "seed" xáo trộn. Cùng dữ liệu luôn cho cùng kết quả, nên quay ở máy nào cũng ra đúng món đã chia.
   stock (không bắt buộc) = { qty: [...], seed } để thử số lượng khác ở trang admin. Trả về { id: [món] }. */
function w20Assign(stock) {
  stock = stock || (typeof W20STOCK !== "undefined" ? W20STOCK : {});
  var P = W20CFG.prizes, ppl = (typeof W20P === "undefined" ? [] : W20P).slice(), n = ppl.length, seed = String(stock.seed || "2010"), i, j, k;
  ppl.sort(function (a, b) { return w20Hash(a.id + "|" + seed) - w20Hash(b.id + "|" + seed); });
  var q = P.map(function (p, x) { return Math.max(0, Math.min(n, parseInt((stock.qty || [])[x], 10) || 0)); }), tot = q.reduce(function (a, b) { return a + b; }, 0), need = n;
  if (tot < need) { var rest = need - tot, guard = 0; for (k = 0; rest > 0 && guard < 5000; k = (k + 1) % P.length, guard++) if (q[k] < n) { q[k]++; rest--; } }
  var slots = [], used = P.map(function () { return 0; });
  while (slots.length < need) { var moved = false; for (i = 0; i < P.length && slots.length < need; i++) if (used[i] < q[i]) { used[i]++; slots.push(i); moved = true; } if (!moved) break; }
  while (slots.length < need) slots.push(slots.length % P.length);
  var pool = slots.slice(), rnd = function (x) { return w20Hash(seed + "#" + x); };
  for (i = pool.length - 1; i > 0; i--) { j = rnd(i) % (i + 1); var t0 = pool[i]; pool[i] = pool[j]; pool[j] = t0; }
  var out = {}; for (i = 0; i < n; i++) out[ppl[i].id] = [pool[i]];
  return out;
}

/* Cố định màn hình trên điện thoại: không thu phóng bằng 2 ngón hay chạm đúp */
(function () {
  var stop = function (e) { e.preventDefault(); };
  ["gesturestart", "gesturechange", "gestureend"].forEach(function (t) { document.addEventListener(t, stop, { passive: false }); });
  document.addEventListener("touchmove", function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  var last = 0; document.addEventListener("touchend", function (e) { var n = Date.now(); if (n - last < 350) e.preventDefault(); last = n; }, { passive: false });
  document.addEventListener("wheel", function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
})();

/* Chức danh gọn trên thiệp: bỏ "Chuyên viên…", bỏ chữ "PTSPBL" thừa */
function w20Sub(t) { t = String(t || "").trim(); if (!t || /chuyên viên/i.test(t)) return ""; return t.replace(/\s*Phòng\s+PTSPBL\s*$/i, " Phòng").replace(/\s*PTSPBL\s*$/i, "").trim(); }

/* Biểu tượng quà: emoji hoặc ảnh (đường dẫn assets/…) → HTML */
function w20IconHTML(icon, size) { icon = String(icon || ""); size = size || 32; return /^assets\//.test(icon) ? '<img src="' + icon + '?v=20261015" alt="" style="height:' + size + 'px;width:auto;vertical-align:middle;display:inline-block">' : icon; }

/* ===== Mở sang trình duyệt ngoài (Safari/Chrome) từ Zalo/Facebook, mang theo tiến độ để không phải chơi lại từ đầu ===== */
function w20ExternalURL() {
  var base = location.origin + location.pathname + location.search, st = "";
  try { st = window.W20EXPORT ? window.W20EXPORT() : ""; } catch (e) {}
  if (!st) return base;
  try { return base + "#s=" + encodeURIComponent(btoa(unescape(encodeURIComponent(st)))); } catch (e) { return base; }
}
function w20ImportHash() { /* đọc tiến độ từ #s=… (nếu có) rồi xóa khỏi thanh địa chỉ */
  var m = /[#&]s=([^&]+)/.exec(location.hash || ""); if (!m) return null;
  try { var o = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(m[1]))))); try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} return o; } catch (e) { return null; }
}
function w20OpenExternal(done) {
  var ua = navigator.userAgent || "", url = w20ExternalURL(), u;
  try { u = new URL(url); } catch (e) { return false; }
  if (/iPhone|iPad|iPod/i.test(ua)) { location.href = "x-safari-" + url; }
  else if (/Android/i.test(ua)) { location.href = "intent://" + u.host + u.pathname + u.search + u.hash + "#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=" + encodeURIComponent(url) + ";end"; }
  else { window.open(url, "_blank"); }
  setTimeout(function () { if (!document.hidden) done && done(false); }, 1500); /* vẫn còn ở đây = ứng dụng không cho mở */
  return true;
}

/* Lưu ảnh thiệp: trình duyệt thường thì tải về; trong Zalo/Facebook… (không cho tải) thì thử chia sẻ ảnh, mở ảnh riêng, hoặc nhấn giữ để lưu */
function w20SaveImage(cv, name, done) {
  var inapp = w20InApp();
  function say(t) { var el = document.getElementById("toast"); if (el) { el.textContent = t; el.className = "toast show"; clearTimeout(say.t); say.t = setTimeout(function () { el.className = "toast"; }, 3800); } }
  function overlay() {
    var url = cv.toDataURL("image/png"), link = w20ExternalURL(), d = document.createElement("div"); d.className = "savebox";
    d.innerHTML = '<div class="sv-in"><p class="sv-t">Nhấn giữ vào ảnh rồi chọn <b>“Lưu ảnh”</b></p><img alt="Thiệp 20/10" src="' + url + '">'
      + '<div class="sv-b"><button type="button" class="btn pink sv-share" hidden>📲 Lưu / Gửi ảnh</button><a class="btn sv-img" target="_blank" rel="noopener" hidden>🖼️ Mở ảnh riêng để lưu</a><button type="button" class="btn ghost sv-open">🌐 Mở bằng Safari/Chrome</button><button type="button" class="btn sv-x">Đóng</button></div>'
      + '<p class="sv-h">Nếu chưa lưu được: dán link bên dưới vào Safari/Chrome (tiến độ vẫn được giữ), hoặc bấm <b>⋯</b> → <b>“Mở bằng trình duyệt”</b>.</p><input class="sv-url" readonly value="' + link.replace(/"/g, "&quot;") + '"></div>';
    document.body.appendChild(d);
    var shareBtn = d.querySelector(".sv-share"), imgLink = d.querySelector(".sv-img"), inp = d.querySelector(".sv-url");
    d.querySelector(".sv-x").onclick = function () { d.remove(); };
    d.querySelector(".sv-open").onclick = function () { w20OpenExternal(function () { say("Ứng dụng chưa cho mở tự động. Bấm ⋯ (góc phải trên) → Mở bằng trình duyệt, hoặc dán link bên dưới nhé"); }); };
    inp.onclick = inp.onfocus = function () { try { inp.select(); inp.setSelectionRange(0, 99999); } catch (e) {} w20Copy(link, function () { say("Đã chọn sẵn link, nếu chưa tự sao chép thì nhấn giữ rồi chọn “Sao chép” 📋"); }); };
    cv.toBlob(function (b) { /* thử chia sẻ file ảnh (nếu ứng dụng hỗ trợ) và mở ảnh riêng */
      if (!b) return; var file = null; try { file = new File([b], name, { type: "image/png" }); } catch (e) {}
      imgLink.href = URL.createObjectURL(b); imgLink.hidden = false;
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { shareBtn.hidden = false; shareBtn.onclick = function () { navigator.share({ files: [file], title: "Thiệp 20/10" }).catch(function () {}); }; }
    }, "image/png");
    done && done();
  }
  if (inapp) { overlay(); return; }
  try {
    cv.toBlob(function (b) {
      if (!b) { overlay(); return; }
      try { var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); done && done(); } catch (e) { overlay(); }
    }, "image/png");
  } catch (e) { overlay(); }
}
function w20InApp() { return /Zalo|FBAN|FBAV|FB_IAB|Instagram|Line\/|; wv\)|MiuiBrowser|MicroMessenger|KAKAOTALK/i.test(navigator.userAgent || ""); }
/* Trong Zalo/Facebook: luôn gắn tiến độ vào địa chỉ trang (#s=…) để "Mở bằng trình duyệt" của ứng dụng cũng mang theo tiến độ */
function w20SyncHash() {
  if (!w20InApp() || !window.W20EXPORT) return;
  try { var st = window.W20EXPORT(); if (st) history.replaceState(null, "", location.pathname + location.search + "#s=" + encodeURIComponent(btoa(unescape(encodeURIComponent(st))))); } catch (e) {}
}

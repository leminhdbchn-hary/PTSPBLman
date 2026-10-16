/* Sân khấu giả lập (nhiều chị nhận quà cùng lúc: tối đa 5 cặp lên cùng một lượt; mỗi cặp một kiểu trao quà, mỗi chị một danh hiệu hoa hậu)
   Sân khấu giả lập (trang Admin): khi một chị em quay xong, một anh Chibi đại diện bước lên tặng quà cho chị (cũng là Chibi).
   Ảnh mặt chị em: đặt file assets/women/<mã người>.webp (mã trong assets/people.js, VD f513a5.webp). Chưa có ảnh thì vẽ mặt hoạt hình.
   W20Stage.make(canvas, opts) → { play({id,name,prize:{icon,name}}), queue(evt), idle() } */
var W20Stage = (function () {
  var W = 960, H = 540, GY = 470;
  function img(src) { return w20Img(src); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function ease(k) { k = Math.max(0, Math.min(1, k)); return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function backdrop(g, t) {
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#3a0f3a"); bg.addColorStop(.6, "#7a1d4f"); bg.addColorStop(1, "#2a0b24"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    /* tia sáng sân khấu */
    [[260, -.28], [480, 0], [700, .28]].forEach(function (s, i) {
      var sw = Math.sin(t / 1400 + i * 2) * .06, gr = g.createLinearGradient(s[0], 0, s[0] + Math.sin(s[1] + sw) * 420, H);
      gr.addColorStop(0, "rgba(255,236,170,.30)"); gr.addColorStop(1, "rgba(255,236,170,0)");
      g.save(); g.translate(s[0], 0); g.rotate(s[1] + sw); g.fillStyle = gr; g.beginPath(); g.moveTo(-18, 0); g.lineTo(18, 0); g.lineTo(150, H * 1.1); g.lineTo(-150, H * 1.1); g.closePath(); g.fill(); g.restore();
    });
    /* phông nền: vòm cổng hoa + sao lấp lánh + bóng bay + khán giả */
    var arch = g.createRadialGradient(W / 2, 250, 40, W / 2, 250, 470); arch.addColorStop(0, "rgba(255,170,220,.38)"); arch.addColorStop(.6, "rgba(190,70,150,.16)"); arch.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = arch; g.fillRect(0, 0, W, GY);
    g.save(); g.strokeStyle = "rgba(255,226,140,.55)"; g.lineWidth = 6; g.beginPath(); g.moveTo(190, GY - 8); g.lineTo(190, 190); g.quadraticCurveTo(W / 2, 40, W - 190, 190); g.lineTo(W - 190, GY - 8); g.stroke(); g.restore();
    for (var q = 0; q < 46; q++) { var tq = q / 45, ax = 190 + tq * (W - 380), ay = 190 - Math.sin(tq * Math.PI) * 120 + 0; var fc = ["#ffb3d1", "#ff7aa8", "#fff1b8", "#ffd1e6"][q % 4]; g.fillStyle = fc; g.beginPath(); g.arc(ax, ay + 8 + Math.sin(t / 700 + q) * 1.5, 7 + (q % 3) * 2, 0, 6.283); g.fill(); if (q % 3 === 0) { g.fillStyle = "#3aa66a"; g.beginPath(); g.ellipse(ax + 9, ay + 14, 8, 3.5, .6, 0, 6.283); g.fill(); } }
    for (var sp = 0; sp < 34; sp++) { var sx = (sp * 211.7) % W, sy = 50 + (sp * 97.3) % 360, tw = .35 + .65 * Math.abs(Math.sin(t / 600 + sp)); g.fillStyle = "rgba(255,240,190," + tw + ")"; g.beginPath(); g.arc(sx, sy, 1.2 + (sp % 3) * .9, 0, 6.283); g.fill(); }
    [[250, "#ff6f96"], [315, "#ffd24a"], [W - 250, "#ff6f96"], [W - 315, "#7fe0c8"], [W - 280, "#ffd24a"], [280, "#7fe0c8"]].forEach(function (b, i) {
      var bx = b[0], by = 230 + (i % 3) * 38 + Math.sin(t / 900 + i * 1.7) * 9; g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(bx, by + 34); g.quadraticCurveTo(bx + 8, by + 70, bx - 4, by + 112); g.stroke();
      var bg = g.createRadialGradient(bx - 8, by - 10, 4, bx, by, 34); bg.addColorStop(0, "#fff"); bg.addColorStop(.25, b[1]); bg.addColorStop(1, "rgba(0,0,0,.35)"); g.fillStyle = bg; g.beginPath(); g.ellipse(bx, by, 26, 33, 0, 0, 6.283); g.fill(); g.fillStyle = b[1]; g.beginPath(); g.moveTo(bx, by + 33); g.lineTo(bx - 5, by + 41); g.lineTo(bx + 5, by + 41); g.closePath(); g.fill();
    });
    /* sàn gỗ */
    var fl = g.createLinearGradient(0, GY - 20, 0, H); fl.addColorStop(0, "#c98a4b"); fl.addColorStop(1, "#6e421d"); g.fillStyle = fl; g.fillRect(0, GY - 10, W, H - GY + 10);
    g.strokeStyle = "rgba(60,30,10,.35)"; g.lineWidth = 2; for (var x = -40; x < W + 80; x += 90) { g.beginPath(); g.moveTo(x, GY - 10); g.lineTo(x - 70 + (x - W / 2) * .35, H); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(0, GY - 10, W, 4);
    var rf = g.createLinearGradient(0, GY - 10, 0, GY + 60); rf.addColorStop(0, "rgba(255,240,200,.28)"); rf.addColorStop(1, "rgba(255,240,200,0)"); g.fillStyle = rf; g.fillRect(0, GY - 10, W, 70);
    /* thảm đỏ */
    g.fillStyle = "#b3122f"; g.beginPath(); g.moveTo(300, GY + 2); g.lineTo(660, GY + 2); g.lineTo(760, H); g.lineTo(200, H); g.closePath(); g.fill();
    g.strokeStyle = "#f3c969"; g.lineWidth = 3; g.beginPath(); g.moveTo(300, GY + 2); g.lineTo(200, H); g.moveTo(660, GY + 2); g.lineTo(760, H); g.stroke();
    /* khán giả ở dưới (bóng đen + que cổ vũ sáng) */
    g.fillStyle = "rgba(20,4,22,.92)"; for (var au = 0; au < 18; au++) { var axp = 20 + au * 54 + (au % 2) * 14, ah = 18 + (au * 7) % 12; g.beginPath(); g.arc(axp, H - 6, 22 + (au % 3) * 3, Math.PI, 0); g.fill(); g.beginPath(); g.arc(axp, H - 6 - ah - 8, 12, 0, 6.283); g.fill(); }
    for (var gl = 0; gl < 9; gl++) { var gx = 40 + gl * 108 + (gl % 2) * 30, gy2 = H - 40 - Math.abs(Math.sin(t / 420 + gl * 1.3)) * 14; g.strokeStyle = ["#ff7aa8", "#ffe08a", "#8ff0d0"][gl % 3]; g.lineWidth = 4; g.lineCap = "round"; g.shadowColor = g.strokeStyle; g.shadowBlur = 10; g.beginPath(); g.moveTo(gx, gy2); g.lineTo(gx + 6, gy2 - 20); g.stroke(); g.shadowBlur = 0; }
    /* rèm */
    [[0, 1], [W, -1]].forEach(function (c) {
      g.save(); g.translate(c[0], 0); g.scale(c[1], 1);
      var cg = g.createLinearGradient(0, 0, 170, 0); cg.addColorStop(0, "#7d0c26"); cg.addColorStop(1, "#c8213f"); g.fillStyle = cg;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(170, 0); g.quadraticCurveTo(100, 160, 150, 330); g.quadraticCurveTo(190, 460, 120, GY); g.lineTo(0, GY); g.closePath(); g.fill();
      g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 3; for (var k = 25; k < 150; k += 32) { g.beginPath(); g.moveTo(k, 0); g.quadraticCurveTo(k + 20, 220, k - 8, GY); g.stroke(); }
      g.restore();
    });
    /* băng rôn tên chương trình */
    g.save(); var bw = 520, bx = W / 2 - bw / 2, bg2 = g.createLinearGradient(0, 24, 0, 66); bg2.addColorStop(0, "#ffe9a0"); bg2.addColorStop(1, "#e0a100");
    g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 12; g.shadowOffsetY = 4; g.fillStyle = bg2; g.beginPath(); g.moveTo(bx - 26, 26); g.lineTo(bx + bw + 26, 26); g.lineTo(bx + bw + 10, 46); g.lineTo(bx + bw + 26, 66); g.lineTo(bx - 26, 66); g.lineTo(bx - 10, 46); g.closePath(); g.fill(); g.shadowColor = "transparent";
    g.strokeStyle = "rgba(122,29,79,.5)"; g.lineWidth = 2; g.stroke(); g.fillStyle = "#7a1d4f"; g.font = "700 27px 'Playfair Display',serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("✨ Chương trình 20.10 Phòng PTSPBL ✨", W / 2, 47); g.restore();
    g.fillStyle = "#f3c969"; g.fillRect(0, 0, W, 16); g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(0, 16, W, 5);
    /* bóng đèn viền */
    for (var i = 0; i < 24; i++) { if (i > 7 && i < 16) continue; g.fillStyle = (Math.floor(t / 400) + i) % 2 ? "#fff6c9" : "#ffb24a"; g.beginPath(); g.arc(20 + i * 40, 30, 5, 0, 6.283); g.fill(); }
  }
  function gift(g, x, y, s, prize, a) {
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = a == null ? 1 : a;
    g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 10; g.shadowOffsetY = 4;
    var bd = g.createLinearGradient(0, -20, 0, 36); bd.addColorStop(0, "#e8458a"); bd.addColorStop(1, "#a8124f"); g.fillStyle = bd; w20Rr(g, -34, -14, 68, 50, 6); g.fill();
    g.shadowColor = "transparent"; g.fillStyle = "#f6c453"; g.fillRect(-6, -14, 12, 50); g.fillStyle = "#ff6f96"; w20Rr(g, -40, -26, 80, 18, 5); g.fill(); g.fillStyle = "#f6c453"; g.fillRect(-6, -26, 12, 18);
    g.fillStyle = "#ff5a7e"; g.beginPath(); g.ellipse(-13, -34, 13, 9, -.5, 0, 6.283); g.ellipse(13, -34, 13, 9, .5, 0, 6.283); g.fill(); g.fillStyle = "#b5123a"; g.beginPath(); g.arc(0, -32, 5, 0, 6.283); g.fill();
    g.restore();
  }
  function prizeIcon(g, icon, x, y, size) {
    icon = String(icon || "🎁");
    if (/^assets\//.test(icon)) { var im = img(icon); if (im.complete && im.naturalWidth) { var h = size, w = h * im.naturalWidth / im.naturalHeight; g.drawImage(im, x - w / 2, y - h / 2, w, h); } }
    else { g.save(); g.font = size * .9 + "px 'Segoe UI Emoji','Apple Color Emoji',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(icon, x, y); g.restore(); }
  }
  var TITLES = [
    ["Người xinh đẹp nhất", ["#ff9ac4", "#d6336c"]], ["Người đáng yêu nhất", ["#ffb38a", "#e8590c"]], ["Người cười tươi nhất", ["#ffd666", "#e0a100"]],
    ["Người hiền nhất phòng", ["#9be7c4", "#12a05f"]], ["Người giỏi giang nhất", ["#9ec5ff", "#2b6fd6"]], ["Người đẹp không cần filter", ["#d9a8ff", "#8a3fd0"]],
    ["Người ít than việc nhất", ["#8fe3e8", "#0f9aa6"]], ["Người đi ăn trưa đúng giờ nhất", ["#ffc2a8", "#d9480f"]], ["Người có giọng nói ngọt nhất", ["#ffa8d8", "#c2255c"]], ["Người luôn làm việc “rất nhanh”", ["#c8e07a", "#6a9a1a"]]
  ];
  function hash(x) { var h = 0; x = String(x); for (var i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0; return h; }
  function shortName(n) { var w = String(n || "").trim().split(/\s+/); return w.length > 3 ? w[0] + " " + w.slice(-2).join(" ") : w.join(" "); }
  /* chị em Chibi hoa hậu: váy xoè, băng đô vương miện, dải sash; đầu là ảnh assets/women/<id>.webp (nếu có) */
  function girl(g, cx, gy, sc, o) {
    var t = o.t || 0, jump = o.jump || 0, dir = o.dir || -1, sw = Math.sin(t / 110) * (o.walk ? 6 : 0), pal = o.pal || ["#ff8fb4", "#d6336c"];
    g.save(); g.translate(cx, gy); g.scale(sc, sc);
    g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.ellipse(0, 3, 52 - jump * .12, 10, 0, 0, 6.283); g.fill();
    g.translate(0, -jump);
    g.fillStyle = "#f2c9a6"; [-1, 1].forEach(function (d) { g.fillRect(d * 11 - 5, -34, 10, 32); g.fillStyle = "#7a1a3a"; g.beginPath(); g.ellipse(d * 11, -1, 11, 6, 0, 0, 6.283); g.fill(); g.fillStyle = "#f2c9a6"; });
    /* váy hoa hậu xoè rộng, lấp lánh */
    var dg = g.createLinearGradient(0, -110, 0, -20); dg.addColorStop(0, pal[0]); dg.addColorStop(1, pal[1]); g.fillStyle = dg;
    g.beginPath(); g.moveTo(-24, -112); g.lineTo(24, -112); g.bezierCurveTo(30, -70, 74, -46, 78, -18); g.quadraticCurveTo(0, 0, -78, -18); g.bezierCurveTo(-74, -46, -30, -70, -24, -112); g.closePath(); g.fill();
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 2; for (var k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(k * 7, -88); g.quadraticCurveTo(k * 22, -50, k * 26, -14); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,.9)"; for (var q = 0; q < 9; q++) { var sx = Math.sin(q * 12.9 + t / 900 * (q % 2 ? 1 : -1)) * 58, sy = -80 + (q * 37 % 60); g.beginPath(); g.arc(sx, sy + 20, 2.2, 0, 6.283); g.fill(); }
    /* dải sash */
    g.save(); g.strokeStyle = "#fff6c9"; g.lineWidth = 11; g.lineCap = "butt"; g.beginPath(); g.moveTo(-26, -110); g.lineTo(26, -66); g.stroke(); g.strokeStyle = "#e0a100"; g.lineWidth = 2; g.stroke(); g.restore();
    g.strokeStyle = "#f2c9a6"; g.lineWidth = 12; g.lineCap = "round";
    var armA = o.arms == null ? 0 : o.arms;
    [-1, 1].forEach(function (d) {
      g.beginPath(); g.moveTo(d * 22, -104);
      if (armA === 2) { if (d > 0) g.lineTo(46, -96); else g.lineTo(-46, -166 + Math.sin(t / 90) * 8); }
      else if (armA === 1) g.lineTo(dir * 46, -88 - d * 6);
      else g.lineTo(d * 40 - d * sw, -62);
      g.stroke();
    });
    var im = o.img, hw = 112, hh = 126;
    g.translate(0, -146); g.rotate(Math.sin(t / 220) * .05);
    if (im && im.complete && im.naturalWidth) { hh = hw * im.naturalHeight / im.naturalWidth; g.shadowColor = "rgba(0,0,0,.3)"; g.shadowBlur = 8; g.drawImage(im, -hw / 2, -hh / 2 - 6, hw, hh); g.shadowColor = "transparent"; }
    else {
      g.fillStyle = "#3b2418"; g.beginPath(); g.ellipse(0, -6, 52, 56, 0, 0, 6.283); g.fill();
      g.fillStyle = "#f6d3b0"; g.beginPath(); g.ellipse(0, 4, 42, 46, 0, 0, 6.283); g.fill();
      g.fillStyle = "#3b2418"; g.beginPath(); g.ellipse(0, -30, 46, 22, 0, Math.PI, 6.283); g.fill();
      g.fillStyle = "#2a1a12"; g.beginPath(); g.arc(-15, 2, 4.5, 0, 6.283); g.arc(15, 2, 4.5, 0, 6.283); g.fill();
      g.strokeStyle = "#c2476b"; g.lineWidth = 3; g.beginPath(); g.arc(0, 14, 10, .15, 2.99); g.stroke();
      g.fillStyle = "rgba(255,120,140,.45)"; g.beginPath(); g.ellipse(-27, 12, 8, 5, 0, 0, 6.283); g.ellipse(27, 12, 8, 5, 0, 0, 6.283); g.fill();
    }
    /* vương miện */
    var top = -(hh / 2) - 12; g.fillStyle = "#ffd24a"; g.strokeStyle = "#b8860b"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-26, top + 4); g.lineTo(-26, top - 14); g.lineTo(-13, top - 2); g.lineTo(0, top - 22); g.lineTo(13, top - 2); g.lineTo(26, top - 14); g.lineTo(26, top + 4); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = "#ff4f86"; g.beginPath(); g.arc(0, top - 6, 4, 0, 6.283); g.fill();
    g.restore();
  }
  function wrapTxt(g, txt, w) { var ws = txt.split(" "), L = [], c = ""; ws.forEach(function (x) { var n = c ? c + " " + x : x; if (g.measureText(n).width > w && c) { L.push(c); c = x; } else c = n; }); if (c) L.push(c); return L; }
  function plate(g, cx, y, w, it, fs, a) {
    g.save(); g.globalAlpha = a; g.textAlign = "center"; g.textBaseline = "alphabetic";
    g.font = "700 " + fs + "px 'Playfair Display',serif"; var tl = wrapTxt(g, "👑 " + it.title[0], w - 16);
    g.font = "700 " + fs * .9 + "px 'Be Vietnam Pro',sans-serif"; var pn = it.prize && it.prize.name || "quà bí mật", nl = wrapTxt(g, pn, w - 16 - fs * 1.2);
    var lh = fs * 1.25, h = 14 + (tl.length + 1 + nl.length) * lh + 6;
    g.fillStyle = "rgba(255,246,214,.97)"; g.shadowColor = "rgba(0,0,0,.4)"; g.shadowBlur = 14; w20Rr(g, cx - w / 2, y, w, h, 16); g.fill(); g.shadowColor = "transparent";
    var yy = y + 10 + fs; g.fillStyle = "#8a1040"; g.font = "700 " + fs + "px 'Playfair Display',serif"; tl.forEach(function (l) { g.fillText(l, cx, yy); yy += lh; });
    g.fillStyle = "#c2255c"; g.font = "700 " + fs * .95 + "px 'Be Vietnam Pro',sans-serif"; g.fillText(shortName(it.name), cx, yy); yy += lh;
    g.fillStyle = "#3b2418"; g.font = "700 " + fs * .9 + "px 'Be Vietnam Pro',sans-serif";
    nl.forEach(function (l, i) { var tw = g.measureText(l).width, ox = i === 0 ? fs * .6 : 0; g.textAlign = "left"; g.fillText(l, cx - tw / 2 + ox, yy); if (i === 0) prizeIcon(g, it.prize && it.prize.icon, cx - tw / 2 - fs * .55 + ox, yy - fs * .3, fs * 1.2); g.textAlign = "center"; yy += lh; });
    g.restore();
  }
  var STYLES = ["Đưa hai tay", "Quỳ gối trao", "Cúi chào trao quà", "Đưa quà rồi vẫy tay chào", "Bước tới trao quà rồi bắt tay"];
  function make(cv, opt) {
    cv.width = W; cv.height = H; var g = cv.getContext("2d"), Q = [], cur = null, raf = 0, nextMan = 0, nextStyle = 0;
    opt = opt || {};
    var MEN = (typeof W20CFG !== "undefined" && W20CFG.men) || [];
    MEN.forEach(function (m) { img(m.img); });
    var T1 = 2300, T2 = 3800, TEND = 10500;
    function drawPair(it, t, n, now) {
      var sc = [0, 1.45, 1.2, 1.02, .9, .8][n], slotW = (W - 70) / n, c = 35 + slotW * (it.k + .5), d = 58 * sc;
      var mxT = c - d, wxT = c + d, st = it.style, k1 = ease(t / T1), mx = lerp(-130, mxT, k1), wx = lerp(W + 130, wxT, k1);
      var u = t < T1 ? 0 : ease((t - T1) / (T2 - T1)), after = t >= T2, tt = t - T2, walking = t < T1;
      var carry = [mx + 36 * sc, GY - 76 * sc], hand = [wxT - 44 * sc, GY - 84 * sc], gs = .62 * sc;
      var mo = { img: w20Img(it.man.img), dir: 1, step: now / 110 + it.k, lift: 0, run: walking ? 1 : 0 }, wo = { t: now + it.k * 300, img: it.wimg, dir: -1, walk: walking ? 1 : 0, arms: 0, pal: it.title[1] };
      var gp = null, kneel = 0, tilt = 0;
      if (!walking) mo.step = 1.6;
      if (walking) { mo.lift = Math.abs(Math.sin(now / 130 + it.k)) * 5; if (st !== 4) { mo.reach = carry; gp = [carry[0] + 6, carry[1] - 22 * sc]; } else mo.reach = null; }
      else if (!after) {
        wx = wxT; mx = mxT;
        if (st === 0) { var r0 = [lerp(carry[0], hand[0], u), lerp(carry[1], hand[1], u)]; mo.reach = r0; gp = [r0[0] + 10 * sc, r0[1] - 12 * sc]; wo.arms = u > .4 ? 1 : 0; }
        else if (st === 1) { kneel = 36 * ease(Math.min(1, u * 3)) * (1 - ease(Math.max(0, (u - .72) / .28))); var uu = Math.min(1, u * 1.5), r1 = [lerp(carry[0], hand[0] - 4 * sc, uu), lerp(carry[1], GY - 150 * sc + 40 * sc * Math.max(0, (u - .72) / .28), uu)]; mo.reach = r1; gp = [r1[0] + 6 * sc, r1[1] - 20 * sc]; if (u > .62) { var gv = ease((u - .62) / .38); gp = [lerp(gp[0], wx - 30 * sc, gv), lerp(gp[1], GY - 112 * sc, gv)]; } wo.arms = u > .4 ? 1 : 0; }
        else if (st === 2) { tilt = .3 * Math.sin(u * Math.PI); var r2 = [lerp(carry[0], hand[0], u), lerp(carry[1], hand[1] + 6 * sc, u)]; mo.reach = r2; gp = [r2[0] + 8 * sc, r2[1] - 12 * sc]; wo.arms = u > .4 ? 1 : 0; }
        else if (st === 3) { var r3 = [lerp(carry[0], hand[0] + 6 * sc, u), lerp(carry[1], hand[1] - 10 * sc, u)]; mo.reach = r3; gp = [r3[0] + 10 * sc, r3[1] - 12 * sc]; if (u > .75) { var g3 = ease((u - .75) / .25); gp = [lerp(gp[0], wx - 30 * sc, g3), lerp(gp[1], GY - 112 * sc, g3)]; } wo.arms = u > .35 ? 1 : 0; }
        else { mx = mxT + 22 * sc * u; var r4 = [lerp(carry[0] + 22 * sc * u, hand[0] + 22 * sc, u), lerp(carry[1], hand[1], u)]; mo.reach = r4; gp = [r4[0] + 10 * sc, r4[1] - 12 * sc]; if (u > .7) { var g4 = ease((u - .7) / .3); gp = [lerp(gp[0], wx - 30 * sc, g4), lerp(gp[1], GY - 112 * sc, g4)]; } wo.arms = u > .4 ? 1 : 0; }
      } else {
        wx = wxT; mx = mxT; wo.arms = 2; wo.jump = Math.abs(Math.sin(tt / 260 + it.k)) * 26 * sc / 1.7; mo.clap = tt / 95 + it.k; mo.lift = Math.abs(Math.sin(tt / 200 + it.k)) * 8; mo.reach = null; mo.run = 0;
        gp = [wx + 46 * sc, GY - 112 * sc - wo.jump]; if (st === 3 && tt < 2600) { mo.clap = null; mo.reach = [mx + 46 * sc, GY - 235 * sc + Math.sin(tt / 120) * 10 * sc]; }
        if (st === 4) { mx = mxT + 22 * sc; wo.arms = 1; wo.jump = 0; mo.clap = null; mo.reach = [wx - 44 * sc, GY - 84 * sc + Math.sin(tt / 110) * 8 * sc]; gp = [wx + 40 * sc, GY - 120 * sc]; if (tt > 2600) { wo.arms = 2; wo.jump = Math.abs(Math.sin(tt / 260)) * 26 * sc / 1.7; mo.reach = null; mo.clap = tt / 95; } }
        if (!it.burst) { it.burst = 1; try { var rc = cv.getBoundingClientRect(); FX.burst(rc.left + rc.width * (c / W), rc.top + rc.height * .5, n > 2 ? 70 : 130); if (it.k === 0) FX.rain(); } catch (er) {} }
      }
      /* nam Chibi */
      g.save(); g.beginPath(); g.rect(0, 0, W, GY + 6); if (kneel) g.clip();
      if (tilt) { g.translate(mx, GY); g.rotate(tilt); g.translate(-mx, -GY); }
      mo.lift = (mo.lift || 0) - kneel; w20Chibi(g, mx, GY, sc, mo); g.restore();
      girl(g, wx, GY, sc, wo);
      if (gp) gift(g, gp[0], gp[1], gs, it.prize, 1);
      if (walking && t < 900 + it.k * 0) { /* lời hô khi bước ra */ }
      if (st === 1 && !walking && !after && u > .2) { g.save(); g.font = 26 * sc / 1.2 + "px 'Segoe UI Emoji',sans-serif"; g.textAlign = "center"; g.fillText("💖", (mx + wx) / 2, GY - 250 * sc - Math.sin(now / 200) * 6); g.restore(); }
      if (after) plate(g, c, 84, Math.min(slotW - 8, 560), it, n === 1 ? 24 : n === 2 ? 19 : n === 3 ? 17 : 14, Math.min(1, tt / 500));
    }
    function frame(now) {
      backdrop(g, now);
      var e = cur;
      if (!e) {
        g.save(); g.fillStyle = "rgba(60,10,50,.55)"; w20Rr(g, W / 2 - 215, 150, 430, 78, 18); g.fill(); g.fillStyle = "rgba(255,255,255,.95)"; g.font = "700 26px 'Playfair Display',serif"; g.textAlign = "center"; g.fillText(opt.waitText || "Đang chờ chị em quay quà…", W / 2, 186);
        g.font = "600 14px 'Be Vietnam Pro',sans-serif"; g.fillStyle = "rgba(255,233,166,.95)"; g.fillText("Chị em quay xong là anh em lên trao quà ngay!", W / 2, 214); g.restore();
        var m0 = MEN[0]; if (m0) w20Chibi(g, 250, GY, 1.45, { img: w20Img(m0.img), dir: 1, step: now / 500, up: 0, lift: 0 });
        girl(g, 710, GY, 1.45, { t: now, dir: -1, arms: 0 });
      } else {
        var t = now - e.t0, n = e.items.length;
        e.items.forEach(function (it) { drawPair(it, Math.max(0, t - it.k * 260), n, now); });
        if (t > TEND + n * 260) { cur = null; opt.onEnd && opt.onEnd(e); }
      }
      raf = requestAnimationFrame(frame);
    }
    function pump() {
      if (cur || !Q.length) return; var now = performance.now();
      if (Q.length < 5 && now - Q[0].at < 1500) return; /* chờ thêm một chút để gom các chị quay cùng lúc thành một lượt */
      var batch = Q.splice(0, 5), used = {};
      var items = batch.map(function (e, k) {
        var ti = hash(e.id || e.name) % TITLES.length; while (used[ti]) ti = (ti + 1) % TITLES.length; used[ti] = 1;
        var man = MEN.length ? MEN[nextMan++ % MEN.length] : { img: "" };
        return { k: k, name: e.name, prize: e.prize, man: man, title: TITLES[ti], style: (nextStyle++) % STYLES.length, wimg: e.id ? w20Img("assets/women/" + e.id + ".webp") : null, burst: 0 };
      });
      cur = { items: items, t0: now };
      opt.onStart && opt.onStart(batch);
    }
    var it = setInterval(pump, 300);
    raf = requestAnimationFrame(frame);
    return { queue: function (e) { e.at = performance.now(); Q.push(e); }, size: function () { return Q.length + (cur ? cur.items.length : 0); }, stop: function () { cancelAnimationFrame(raf); clearInterval(it); }, titles: TITLES, styles: STYLES };
  }
  return { make: make };
})();

/* Sân khấu giả lập (trang Admin): khi một chị em quay xong, một anh Chibi đại diện bước lên tặng quà cho chị (cũng là Chibi).
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
    /* sàn gỗ */
    var fl = g.createLinearGradient(0, GY - 20, 0, H); fl.addColorStop(0, "#c98a4b"); fl.addColorStop(1, "#6e421d"); g.fillStyle = fl; g.fillRect(0, GY - 10, W, H - GY + 10);
    g.strokeStyle = "rgba(60,30,10,.35)"; g.lineWidth = 2; for (var x = -40; x < W + 80; x += 90) { g.beginPath(); g.moveTo(x, GY - 10); g.lineTo(x - 70 + (x - W / 2) * .35, H); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(0, GY - 10, W, 4);
    /* thảm đỏ */
    g.fillStyle = "#b3122f"; g.beginPath(); g.moveTo(300, GY + 2); g.lineTo(660, GY + 2); g.lineTo(760, H); g.lineTo(200, H); g.closePath(); g.fill();
    g.strokeStyle = "#f3c969"; g.lineWidth = 3; g.beginPath(); g.moveTo(300, GY + 2); g.lineTo(200, H); g.moveTo(660, GY + 2); g.lineTo(760, H); g.stroke();
    /* rèm */
    [[0, 1], [W, -1]].forEach(function (c) {
      g.save(); g.translate(c[0], 0); g.scale(c[1], 1);
      var cg = g.createLinearGradient(0, 0, 170, 0); cg.addColorStop(0, "#7d0c26"); cg.addColorStop(1, "#c8213f"); g.fillStyle = cg;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(170, 0); g.quadraticCurveTo(100, 160, 150, 330); g.quadraticCurveTo(190, 460, 120, GY); g.lineTo(0, GY); g.closePath(); g.fill();
      g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 3; for (var k = 25; k < 150; k += 32) { g.beginPath(); g.moveTo(k, 0); g.quadraticCurveTo(k + 20, 220, k - 8, GY); g.stroke(); }
      g.restore();
    });
    g.fillStyle = "#f3c969"; g.fillRect(0, 0, W, 16); g.fillStyle = "rgba(0,0,0,.2)"; g.fillRect(0, 16, W, 5);
    /* bóng đèn viền */
    for (var i = 0; i < 24; i++) { g.fillStyle = (Math.floor(t / 400) + i) % 2 ? "#fff6c9" : "#ffb24a"; g.beginPath(); g.arc(20 + i * 40, 30, 5, 0, 6.283); g.fill(); }
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
  /* chị em Chibi: đầu là ảnh assets/women/<id>.webp (nếu có), thân váy hồng */
  function girl(g, cx, gy, sc, o) {
    var t = o.t || 0, jump = o.jump || 0, up = o.up || 0, dir = o.dir || -1, sw = Math.sin(t / 110) * (o.walk ? 6 : 0);
    g.save(); g.translate(cx, gy); g.scale(sc, sc);
    g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.ellipse(0, 3, 40 - jump * .12, 9, 0, 0, 6.283); g.fill();
    g.translate(0, -jump);
    g.fillStyle = "#f2c9a6"; [-1, 1].forEach(function (d) { g.fillRect(d * 11 - 5, -40 - (o.walk ? Math.max(0, Math.sin(t / 110 + (d > 0 ? 0 : 3.14))) * 6 : 0), 10, 38); g.fillStyle = "#7a1a3a"; g.beginPath(); g.ellipse(d * 11, -1, 11, 6, 0, 0, 6.283); g.fill(); g.fillStyle = "#f2c9a6"; });
    var dg = g.createLinearGradient(0, -110, 0, -30); dg.addColorStop(0, "#ff8fb4"); dg.addColorStop(1, "#d6336c"); g.fillStyle = dg;
    g.beginPath(); g.moveTo(-26, -112); g.lineTo(26, -112); g.lineTo(52, -34); g.quadraticCurveTo(0, -22, -52, -34); g.closePath(); g.fill();
    g.fillStyle = "#fff"; g.globalAlpha = .85; g.beginPath(); g.moveTo(-14, -112); g.lineTo(0, -96); g.lineTo(14, -112); g.closePath(); g.fill(); g.globalAlpha = 1;
    g.strokeStyle = "#f2c9a6"; g.lineWidth = 12; g.lineCap = "round";
    var armA = o.arms == null ? 0 : o.arms; /* 0 xuôi, 1 đưa ra nhận, 2 giơ cao */
    [-1, 1].forEach(function (d) {
      g.beginPath(); g.moveTo(d * 24, -104);
      if (armA === 2) { if (d > 0) g.lineTo(46, -96); else g.lineTo(-46, -166 + Math.sin(t / 90) * 8); }
      else if (armA === 1) g.lineTo(dir * 46, -88 - d * 6);
      else g.lineTo(d * 40 - d * sw, -62);
      g.stroke();
    });
    /* đầu */
    var im = o.img, hw = 112, hh = 126;
    g.translate(0, -146);
    g.rotate(Math.sin(t / 220) * .05);
    if (im && im.complete && im.naturalWidth) { hh = hw * im.naturalHeight / im.naturalWidth; g.shadowColor = "rgba(0,0,0,.3)"; g.shadowBlur = 8; g.drawImage(im, -hw / 2, -hh / 2 - 6, hw, hh); g.shadowColor = "transparent"; }
    else {
      g.fillStyle = "#3b2418"; g.beginPath(); g.ellipse(0, -6, 52, 56, 0, 0, 6.283); g.fill();
      g.fillStyle = "#f6d3b0"; g.beginPath(); g.ellipse(0, 4, 42, 46, 0, 0, 6.283); g.fill();
      g.fillStyle = "#3b2418"; g.beginPath(); g.ellipse(0, -30, 46, 22, 0, Math.PI, 6.283); g.fill();
      g.fillStyle = "#2a1a12"; g.beginPath(); g.arc(-15, 2, 4.5, 0, 6.283); g.arc(15, 2, 4.5, 0, 6.283); g.fill();
      g.strokeStyle = "#c2476b"; g.lineWidth = 3; g.beginPath(); g.arc(0, 14, 10, .15, 2.99); g.stroke();
      g.fillStyle = "rgba(255,120,140,.45)"; g.beginPath(); g.ellipse(-27, 12, 8, 5, 0, 0, 6.283); g.ellipse(27, 12, 8, 5, 0, 0, 6.283); g.fill();
      g.fillStyle = "#ff6f96"; g.beginPath(); g.arc(30, -34, 9, 0, 6.283); g.fill();
    }
    g.restore();
  }
  function bubble(g, x, y, lines) {
    g.save(); g.font = "700 20px 'Be Vietnam Pro',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    var w = 0; lines.forEach(function (l) { w = Math.max(w, g.measureText(l).width); }); w += 36; var h = 20 + lines.length * 26;
    g.fillStyle = "rgba(255,255,255,.96)"; g.shadowColor = "rgba(0,0,0,.3)"; g.shadowBlur = 12; w20Rr(g, x - w / 2, y - h / 2, w, h, 16); g.fill(); g.shadowColor = "transparent";
    g.beginPath(); g.moveTo(x - 10, y + h / 2 - 1); g.lineTo(x, y + h / 2 + 14); g.lineTo(x + 12, y + h / 2 - 1); g.fill();
    g.fillStyle = "#5b1030"; lines.forEach(function (l, i) { g.fillText(l, x, y - h / 2 + 22 + i * 26 + 4); }); g.restore();
  }
  function make(cv, opt) {
    cv.width = W; cv.height = H; var g = cv.getContext("2d"), Q = [], cur = null, raf = 0, last = { id: null }, nextMan = 0;
    opt = opt || {};
    var MEN = (typeof W20CFG !== "undefined" && W20CFG.men) || [];
    MEN.forEach(function (m) { img(m.img); });
    function frame(now) {
      backdrop(g, now);
      var e = cur;
      if (!e) {
        g.save(); g.fillStyle = "rgba(255,255,255,.9)"; g.font = "700 26px 'Playfair Display',serif"; g.textAlign = "center"; g.fillText(opt.waitText || "Đang chờ chị em quay quà…", W / 2, 96);
        g.font = "600 17px 'Be Vietnam Pro',sans-serif"; g.fillStyle = "rgba(255,233,166,.9)"; g.fillText("Chị em quay xong là anh em lên trao quà ngay!", W / 2, 128); g.restore();
        var m0 = MEN[0]; if (m0) w20Chibi(g, 250, GY, 1.7, { img: w20Img(m0.img), dir: 1, step: now / 500, up: 0, lift: 0 });
        girl(g, 710, GY, 1.7, { t: now, dir: -1, arms: 0 });
      } else {
        var t = now - e.t0, man = e.man, pz = e.prize, name = e.name;
        var mx0 = -120, mxA = 300, mxB = 395, wx0 = W + 120, wxA = 640, wxB = 600;
        var mx, wx, manO = { img: w20Img(man.img), dir: 1, step: now / 110, lift: 0, run: 1 }, wO = { t: now, img: e.wimg, dir: -1, walk: 1, arms: 0 }, giftAt = null, giftA = 1;
        var T1 = 2200, T2 = 3500, T3 = 4200;
        if (t < T1) { var k = ease(t / T1); mx = lerp(mx0, mxA, k); wx = lerp(wx0, wxA, k); manO.reach = [mx + 62, GY - 128]; giftAt = [mx + 70, GY - 150]; manO.lift = Math.abs(Math.sin(now / 130)) * 5; }
        else if (t < T2) { var k2 = ease((t - T1) / (T2 - T1)); mx = lerp(mxA, mxB, k2); wx = lerp(wxA, wxB, k2); manO.run = 0; manO.step = 1.6; wO.walk = 0; wO.arms = k2 > .5 ? 1 : 0; var hx = lerp(mx + 62, wx - 78, k2); manO.reach = [hx, GY - 134]; giftAt = [hx + 8, GY - 156]; }
        else { mx = mxB; wx = wxB; manO.run = 0; manO.step = 1.6; wO.walk = 0; var tt = t - T3; if (t < T3) { manO.reach = [wx - 78, GY - 134]; giftAt = [wx - 70, GY - 156]; wO.arms = 1; }
          else { wO.arms = 2; wO.jump = Math.abs(Math.sin(tt / 260)) * 26; manO.clap = tt / 95; manO.lift = Math.abs(Math.sin(tt / 200)) * 10; giftAt = [wx + 78, GY - 190 - wO.jump]; } }
        if (!e.burst && t >= T3) { e.burst = 1; try { FX.burst(cv.getBoundingClientRect().left + cv.getBoundingClientRect().width * .62, cv.getBoundingClientRect().top + cv.getBoundingClientRect().height * .45, 130); FX.rain(); } catch (er) {} }
        w20Chibi(g, mx, GY, 1.7, manO);
        girl(g, wx, GY, 1.7, wO);
        if (giftAt) { gift(g, giftAt[0], giftAt[1], 1.05, pz, giftA); }
        if (t < T1 - 200) bubble(g, mx + 40, GY - 340, ["Tặng quà đây! 🎁"]);
        if (t >= T3) {
          var pa = Math.min(1, (t - T3) / 500);
          g.save(); g.globalAlpha = pa; g.fillStyle = "rgba(255,246,214,.97)"; g.shadowColor = "rgba(0,0,0,.4)"; g.shadowBlur = 16; w20Rr(g, W / 2 - 330, 62, 660, 96, 22); g.fill(); g.shadowColor = "transparent";
          g.textAlign = "center"; g.fillStyle = "#8a1040"; g.font = "700 28px 'Playfair Display',serif"; g.fillText(name, W / 2, 100);
          g.fillStyle = "#3b2418"; g.font = "700 22px 'Be Vietnam Pro',sans-serif";
          var txt = "vừa nhận: " + (pz && pz.name || "quà bí mật"), tw = g.measureText(txt).width; g.textAlign = "left"; g.fillText(txt, W / 2 - tw / 2 + 24, 140);
          prizeIcon(g, pz && pz.icon, W / 2 - tw / 2 - 18, 134, 38);
          g.restore();
        }
        if (t > T3 + 6000) { cur = null; last.id = null; opt.onEnd && opt.onEnd(e); }
      }
      raf = requestAnimationFrame(frame);
    }
    function pump() {
      if (cur || !Q.length) return; var e = Q.shift(), man = MEN.length ? MEN[nextMan++ % MEN.length] : { img: "" };
      cur = { name: e.name, prize: e.prize, man: man, wimg: e.id ? w20Img("assets/women/" + e.id + ".webp") : null, t0: performance.now(), burst: 0, id: e.id };
      opt.onStart && opt.onStart(e);
    }
    var it = setInterval(pump, 400);
    raf = requestAnimationFrame(frame);
    return { queue: function (e) { Q.push(e); pump(); }, size: function () { return Q.length + (cur ? 1 : 0); }, stop: function () { cancelAnimationFrame(raf); clearInterval(it); } };
  }
  return { make: make };
})();

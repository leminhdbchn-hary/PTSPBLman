/* Các mô-đun dùng chung: cắm hoa, vòng quay quà, tường lời chúc */
var W20FL = (typeof W20FN !== "undefined" ? W20FN : ["a", "b", "c", "d", "e", "f", "g", "h"]); /* 8 loại hoa vẽ trong flowers.js */
/* vị trí từng bông trong bó (x, y theo nửa chiều rộng; s = độ to). Bông đặt trước nằm giữa. */
var W20SLOT = [[0, -.3, 1.2], [-.38, -.22, 1.04], [.38, -.2, 1.04], [-.2, -.6, 1.06], [.22, -.58, 1.06], [-.6, -.5, .92], [.6, -.48, .92],
  [0, -.9, .96], [-.4, -.86, .86], [.42, -.84, .86], [-.74, -.2, .84], [.74, -.18, .84]];
var W20SPR = {};
function w20Spr(e, px) { /* emoji (hoặc ảnh assets/…) vẽ sẵn thành hình vuông (nét, nhẹ) */
  var k = e + px; if (W20SPR[k]) return W20SPR[k];
  var c = document.createElement("canvas"); c.width = c.height = px; var g = c.getContext("2d");
  if (/^assets\//.test(e)) { var im = w20Img(e); if (!im.complete || !im.naturalWidth) return c; /* chưa tải xong: trả hình trống, không lưu cache */
    var sc = Math.min(px * .92 / im.naturalWidth, px * .92 / im.naturalHeight), w = im.naturalWidth * sc, h = im.naturalHeight * sc; g.drawImage(im, (px - w) / 2, (px - h) / 2, w, h); return (W20SPR[k] = c); }
  g.font = Math.round(px * .8) + "px serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e, px / 2, px * .56);
  return (W20SPR[k] = c);
}
function w20Leaf(g, x, y, len, wid, ang, c1, c2) {
  g.save(); g.translate(x, y); g.rotate(ang);
  var gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr;
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -wid, len, 0); g.quadraticCurveTo(len * .5, wid, 0, 0); g.fill();
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = Math.max(1, wid * .08); g.beginPath(); g.moveTo(0, 0); g.lineTo(len * .9, 0); g.stroke(); g.restore();
}
/* Vẽ bó hoa: tâm (cx, cy) là giữa phần hoa, S = nửa chiều rộng bó */
function w20DrawBouquet(g, cx, cy, S, list) {
  if (!S) return; var i, n = list.length, rnd = function (k) { return ((Math.sin(k * 99.13) * 43758.5) % 1 + 1) % 1; };
  var neckY = cy + S * .62, botY = cy + S * 1.25;
  g.save();
  /* bóng mờ dưới bó */
  var sh = g.createRadialGradient(cx, botY, 2, cx, botY, S * .7); sh.addColorStop(0, "rgba(0,0,0,.28)"); sh.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = sh; g.beginPath(); g.ellipse(cx, botY + S * .04, S * .7, S * .12, 0, 0, 6.283); g.fill();
  /* giấy gói phía sau (mép lượn sóng) */
  var bk = g.createLinearGradient(cx - S, cy - S, cx + S, cy + S * .6); bk.addColorStop(0, "#fde3ea"); bk.addColorStop(1, "#f3a9bf");
  g.fillStyle = bk; g.beginPath(); g.moveTo(cx - S * .16, neckY);
  g.lineTo(cx - S * 1.02, cy - S * .55);
  for (i = 0; i <= 6; i++) { var px = cx - S * 1.02 + i * (S * 2.04 / 6), py = cy - S * (.55 + (i % 2 ? .28 : .1)); g.quadraticCurveTo(px - S * .17, py - S * .12, px, py); }
  g.lineTo(cx + S * .16, neckY); g.closePath(); g.fill();
  g.strokeStyle = "rgba(180,70,110,.25)"; g.lineWidth = 2; g.stroke();
  /* lá xanh quanh vòm */
  for (i = 0; i < 11; i++) { var a = -2.95 + i * (2.75 / 10), r = S * (.42 + rnd(i) * .18); w20Leaf(g, cx + Math.cos(a) * S * .5, cy - S * .38 + Math.sin(a) * S * .42, r, S * .15, a, i % 2 ? "#2f7d4f" : "#3e9a5f", i % 2 ? "#7cc48f" : "#a6dcae"); }
  /* hoa baby trắng */
  g.fillStyle = "rgba(255,255,255,.92)";
  for (i = 0; i < 46; i++) { var aa = -3.05 + rnd(i + 7) * 2.95, rr2 = S * (.55 + rnd(i + 3) * .45); g.beginPath(); g.arc(cx + Math.cos(aa) * rr2, cy - S * .36 + Math.sin(aa) * rr2 * .75, S * (.018 + rnd(i) * .018), 0, 6.283); g.fill(); }
  /* hoa: xếp từ sau ra trước */
  var idx = []; for (i = 0; i < n && i < W20SLOT.length; i++) idx.push(i);
  idx.sort(function (p, q) { return W20SLOT[p][1] - W20SLOT[q][1]; });
  g.shadowColor = "rgba(0,0,0,.28)"; g.shadowBlur = S * .06; g.shadowOffsetY = S * .02;
  for (i = 0; i < idx.length; i++) {
    var sl = W20SLOT[idx[i]], sz = S * .6 * sl[2], spr = w20FlowerSprite(list[idx[i]]); sz *= 1.08;
    g.save(); g.translate(cx + sl[0] * S, cy + sl[1] * S); g.rotate(sl[0] * .35); g.drawImage(spr, -sz / 2, -sz / 2, sz, sz); g.restore();
  }
  g.shadowColor = "transparent"; g.shadowBlur = 0; g.shadowOffsetY = 0;
  /* cuống hoa dưới nơ */
  g.strokeStyle = "#3e8a55"; g.lineWidth = S * .03; for (i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(cx + i * S * .02, neckY); g.lineTo(cx + i * S * .035, botY); g.stroke(); }
  /* giấy gói phía trước: hai vạt chéo */
  var f1 = g.createLinearGradient(cx - S, cy, cx + S * .2, neckY); f1.addColorStop(0, "#fff7ee"); f1.addColorStop(1, "#f6d9c9");
  g.fillStyle = f1; g.beginPath(); g.moveTo(cx - S * .92, cy + S * .02); g.quadraticCurveTo(cx - S * .4, cy + S * .22, cx + S * .3, cy + S * .12); g.lineTo(cx + S * .1, botY); g.lineTo(cx - S * .1, botY); g.closePath(); g.fill();
  g.strokeStyle = "rgba(160,110,80,.25)"; g.stroke();
  var f2 = g.createLinearGradient(cx + S, cy, cx - S * .2, neckY); f2.addColorStop(0, "#f7b8ca"); f2.addColorStop(1, "#e7849f");
  g.fillStyle = f2; g.beginPath(); g.moveTo(cx + S * .92, cy + S * .06); g.quadraticCurveTo(cx + S * .4, cy + S * .28, cx - S * .25, cy + S * .2); g.lineTo(cx - S * .08, botY); g.lineTo(cx + S * .14, botY); g.closePath(); g.fill();
  g.strokeStyle = "rgba(150,40,80,.2)"; g.stroke();
  /* nơ lụa */
  var rb = g.createLinearGradient(cx - S * .4, neckY, cx + S * .4, neckY + S * .2); rb.addColorStop(0, "#d6204a"); rb.addColorStop(.5, "#ff5a7e"); rb.addColorStop(1, "#b5123a");
  g.fillStyle = rb;
  [-1, 1].forEach(function (d) {
    g.beginPath(); g.moveTo(cx, neckY); g.bezierCurveTo(cx + d * S * .45, neckY - S * .28, cx + d * S * .5, neckY + S * .18, cx, neckY + S * .02); g.fill();
    g.beginPath(); g.moveTo(cx, neckY + S * .02); g.lineTo(cx + d * S * .2, neckY + S * .42); g.lineTo(cx + d * S * .1, neckY + S * .38); g.lineTo(cx + d * S * .02, neckY + S * .44); g.closePath(); g.fill();
  });
  g.beginPath(); g.ellipse(cx, neckY + S * .01, S * .07, S * .06, 0, 0, 6.283); g.fillStyle = "#a80f33"; g.fill();
  g.fillStyle = "rgba(255,255,255,.35)"; g.beginPath(); g.ellipse(cx - S * .02, neckY - S * .01, S * .03, S * .018, -.4, 0, 6.283); g.fill();
  g.restore();
}
/* ===== Chibi: đầu là ảnh thật (assets/men), thân vẽ bằng canvas ===== */
var W20IMG = {};
function w20Img(src) { if (!W20IMG[src]) { var im = new Image(); im.src = /^assets\//.test(src) ? src + "?v=20261013" : src; W20IMG[src] = im; } return W20IMG[src]; }
function w20Rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
/* o: {img, shirt, step (pha chạy), up (0..1 giơ tay), lift (nhảy, px), flower (emoji hoặc null), dir (+1 nhìn phải, -1 nhìn trái)} */
function w20Chibi(g, cx, gy, sc, o) {
  var step = o.step || 0, up = o.up || 0, lift = o.lift || 0, shirt = o.shirt || "#ffffff", pants = o.pants || "#1b2a4a", skin = "#f2c9a6", dir = o.dir || 1;
  g.save(); g.translate(cx, gy); g.scale(sc * dir, sc);
  if (o.part === "head") g.globalAlpha = 0; /* o.part: "body" chỉ vẽ thân, "head" chỉ vẽ đầu (để đầu luôn nằm trên cùng) */
  /* bóng */ g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.ellipse(0, 2, 38 - lift * .1, 9 - lift * .03, 0, 0, 6.283); g.fill();
  g.translate(0, -lift);
  var swing = Math.sin(step) * 9, legH = 34;
  /* chân */
  [-1, 1].forEach(function (d) { var up2 = Math.max(0, Math.sin(step + (d > 0 ? 0 : 3.14))) * 8; g.fillStyle = pants; w20Rr(g, d * 12 - 7, -legH - up2 + 6, 14, legH - 4, 6); g.fill(); g.fillStyle = "#15151c"; g.beginPath(); g.ellipse(d * 12 + 2, -up2 + 2, 11, 6, 0, 0, 6.283); g.fill(); });
  /* thân */
  var top = -legH - 46;
  g.fillStyle = shirt; w20Rr(g, -28, top, 56, 52, 16); g.fill(); g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#1b1b22"; g.fillRect(-28, top + 40, 56, 5);
  g.fillStyle = shirt === "#ffffff" ? "#e9eef2" : "#33384a"; g.beginPath(); g.moveTo(-9, top); g.lineTo(0, top + 14); g.lineTo(9, top); g.closePath(); g.fill();
  /* tay trái (vẫy theo nhịp chạy) */
  g.lineCap = "round"; g.strokeStyle = shirt; g.lineWidth = 13;
  g.lineJoin = "round"; var cs = o.clap == null ? 0 : (1 + Math.cos(o.clap)) / 2;
  if (o.clap != null) { var lx = -2 - 12 * cs, ly = top + 26; g.beginPath(); g.moveTo(-26, top + 10); g.lineTo(-24 + 8 * (1 - cs), top + 30); g.lineTo(lx, ly); g.stroke(); g.fillStyle = skin; g.beginPath(); g.arc(lx, ly, 7, 0, 6.283); g.fill(); }
  else { g.beginPath(); g.moveTo(-26, top + 10); g.lineTo(-34 - swing * .3, top + 36 + swing * .5); g.stroke(); g.fillStyle = skin; g.beginPath(); g.arc(-34 - swing * .3, top + 40 + swing * .5, 7, 0, 6.283); g.fill(); }
  /* tay phải: có o.reach=[x,y] (toạ độ canvas) thì duỗi tay 2 khúc tới đó, không thì giơ theo "up" */
  var sx0 = 26, sy0 = top + 12, hx, hy, ex = null, ey = 0, L = 48;
  if (o.clap != null) { hx = 2 + 12 * cs; hy = top + 26; ex = 24 - 6 * cs; ey = top + 34; }
  else if (o.reach) {
    var tx = (o.reach[0] - cx) / (sc * dir), ty = (o.reach[1] - gy) / sc + lift, dx = tx - sx0, dy = ty - sy0, d = Math.sqrt(dx * dx + dy * dy) || 1, mx = 2 * L * 1.02;
    if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
    hx = sx0 + dx; hy = sy0 + dy; var Ls = Math.max(L, d / 2 + 1), h2 = Math.sqrt(Math.max(0, Ls * Ls - d * d / 4)), ux = dx / d, uy = dy / d, mxp = sx0 + ux * d / 2, myp = sy0 + uy * d / 2;
    var e1x = mxp - uy * h2, e1y = myp + ux * h2, e2x = mxp + uy * h2, e2y = myp - ux * h2; if (e1y > e2y) { ex = e1x; ey = e1y; } else { ex = e2x; ey = e2y; }
  } else { hx = 26 + 16 * up; hy = top + 12 + 30 * (1 - up) - 40 * up; }
  if (o.flower) { /* cuống hoa nắm trong tay */
    g.strokeStyle = "#2f8a4f"; g.lineWidth = 4; g.beginPath(); g.moveTo(hx, hy - 20); g.lineTo(hx + 2, hy + 36); g.stroke();
    g.fillStyle = "#3e9a5f"; g.beginPath(); g.ellipse(hx + 9, hy + 20, 9, 4, -.6, 0, 6.283); g.fill();
  }
  g.strokeStyle = shirt; g.lineWidth = 13; g.lineJoin = "round"; g.beginPath(); g.moveTo(sx0, sy0); if (ex !== null) g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
  g.fillStyle = skin; g.beginPath(); g.arc(hx, hy, 7.5, 0, 6.283); g.fill();
  if (o.flower) { var fs = 50; g.save(); g.translate(hx, hy - 26); g.rotate(Math.sin(step) * .06); g.drawImage(o.flower, -fs / 2, -fs / 2, fs, fs); g.restore(); }
  g.globalAlpha = 1; if (o.part === "body") { g.restore(); return; }
  /* đầu to */
  var img = o.img, hw = 108, hh = 126; if (img && img.naturalWidth) { hh = hw * img.naturalHeight / img.naturalWidth; }
  g.save(); g.translate(0, top - hh * .5 + 16); g.rotate(Math.sin(step) * .07 * (o.run ? 1 : .3));
  if (img && img.complete && img.naturalWidth) { g.shadowColor = "rgba(0,0,0,.3)"; g.shadowBlur = 8; g.shadowOffsetY = 3; g.scale(dir, 1); g.drawImage(img, -hw / 2, -hh / 2, hw, hh); }
  else { g.fillStyle = skin; g.beginPath(); g.ellipse(0, 0, 50, 56, 0, 0, 6.283); g.fill(); g.fillStyle = "#222"; g.beginPath(); g.arc(-16, -4, 5, 0, 6.283); g.arc(16, -4, 5, 0, 6.283); g.fill(); }
  g.restore(); g.restore();
}

/* Giao diện cắm hoa: các anh chibi chạy ra, mỗi anh cầm 1 bông ném vào bó.
   opt: { min, start, onChange(list), onDone(list, e) } */
function w20BouquetUI(box, opt) {
  opt = typeof opt === "function" ? { onChange: opt } : (opt || {}); var list = (opt.start || []).slice(), min = opt.min || 1, MAX = Math.min(W20SLOT.length, opt.max || min);
  var MEN = (typeof W20CFG !== "undefined" && W20CFG.men) || [], CW = 680, CH = 610, CX = 340, CY = 409, SR = 135, GY = 590, SC = 1.8;
  box.innerHTML = '<div class="bqpal"></div><div class="bqstage"><canvas class="bqcv" width="' + CW + '" height="' + CH + '"></canvas><canvas class="bqan" width="' + CW + '" height="' + CH + '"></canvas></div><div class="bqinfo"></div>'
    + '<div class="acts"><button type="button" class="btn ghost bqauto" style="font-size:15px;padding:10px 18px">🪄 Chọn giúp ' + (opt.min || 1) + ' bông</button><button type="button" class="btn ghost bqundo" style="font-size:15px;padding:10px 18px">↩️ Bỏ bông vừa cắm</button><button type="button" class="btn pink bqgive" style="font-size:16px;padding:12px 22px">💐 Xong bó hoa</button></div>';
  var pal = box.querySelector(".bqpal"), cv = box.querySelector(".bqcv"), g = cv.getContext("2d"), an = box.querySelector(".bqan"), ag = an.getContext("2d"), info = box.querySelector(".bqinfo"), raf = 0, rafA = 0;
  MEN.forEach(function (m) { w20Img(m.img); });
  pal.innerHTML = W20FL.map(function (f, i) { return '<button type="button" class="fl" data-i="' + i + '" aria-label="Thêm hoa ' + f + '"><img alt="" src="' + w20FlowerSprite(i).toDataURL() + '"><span>' + f + "</span></button>"; }).join("");
  var crew = [], finaleOn = false, actors = [], queue = [], nextMan = 0, side = 1, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches, pendingCount = 0;
  function draw() { g.clearRect(0, 0, CW, CH); w20DrawBouquet(g, CX, CY, SR, list); }
  function text() {
    var n = list.length + pendingCount;
    info.textContent = !n ? "Chạm vào loại hoa để các anh chạy ra cắm giúp nha (đủ " + min + " bông là thành một bó)" : n < min ? "Đã có " + n + " bông, cần thêm " + (min - n) + " bông nữa là đẹp" : "Đủ " + n + " bông rồi. Bấm “Xong bó hoa” nha!";
  }
  function upd() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); text(); opt.onChange && opt.onChange(list.slice()); }
  function plant(a) { if (a.man && crew.indexOf(a.man) < 0) crew.push(a.man); if (list.length >= MAX) list.shift(); list.push(a.f); pendingCount = Math.max(0, pendingCount - 1); upd(); }
  /* hoạt cảnh: anh chạy ra, đứng cạnh bó, giơ tay cắm bông hoa vào đúng chỗ rồi vẫy (ms) */
  var T_IN = 1500, T_REACH = 800, T_INS = 900, T_WAVE = 800, T_OUT = 1000, MAXA = 4, fastOn = false;
  function fast(on) { fastOn = on; if (on) { T_IN = 650; T_REACH = 350; T_INS = 400; T_WAVE = 300; T_OUT = 400; MAXA = 2; } else { T_IN = 1500; T_REACH = 800; T_INS = 900; T_WAVE = 800; T_OUT = 1000; MAXA = 4; } }
  function spawn(f) {
    var man = MEN.length ? MEN[nextMan++ % MEN.length] : null, sl = W20SLOT[Math.min(list.length + actors.length, MAX - 1)] || W20SLOT[0], dir;
    if (sl[0] < -.05) dir = 1; else if (sl[0] > .05) dir = -1; else { dir = side; side = -side; }
    var gx = CX + sl[0] * SR, gy = CY + sl[1] * SR, tx = Math.max(118, Math.min(CW - 118, gx - dir * 120));
    var a = { f: f, man: man, t0: performance.now(), dir: dir, planted: false, sx: dir > 0 ? -120 : CW + 120, tx: tx, slot: [gx, gy + 26 * SC], ph: Math.random() * 6 };
    actors.push(a); pendingCount++; text(); if (reduce) { plant(a); actors.pop(); return; } loopA();
  }
  function ease(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function lerp2(p, q, k) { return [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]; }
  function step(a, now) {
    var t = now - a.t0, d = a.dir, o = { img: man_img(a), shirt: a.man && a.man.shirt, step: now / 110 + a.ph, run: 1, dir: d, flower: w20FlowerSprite(a.f) }, x = a.tx, lift = 0;
    var carry = function (xx) { return [xx + d * 34 * SC, GY - 76 * SC]; }, appr = [a.slot[0] - d * 55, a.slot[1] - 70];
    if (t < T_IN) { var e = 1 - Math.pow(1 - t / T_IN, 2); x = a.sx + (a.tx - a.sx) * e; o.reach = carry(x); lift = Math.abs(Math.sin(now / 120 + a.ph)) * 6; }
    else if (t < T_IN + T_REACH) { var k = ease((t - T_IN) / T_REACH); o.run = 0; o.step = 1.6; lift = 48 * k; o.reach = lerp2(carry(x), appr, k); }
    else if (t < T_IN + T_REACH + T_INS) { var k2 = ease((t - T_IN - T_REACH) / T_INS); o.run = 0; o.step = 1.6; lift = 48 + Math.sin(k2 * Math.PI) * 4; o.reach = lerp2(appr, a.slot, k2); }
    else if (t < T_IN + T_REACH + T_INS + T_WAVE) {
      if (!a.planted) { a.planted = true; plant(a); }
      var k3 = (t - T_IN - T_REACH - T_INS) / T_WAVE; o.run = 0; o.flower = null; o.step = now / 90; lift = Math.abs(Math.sin(k3 * Math.PI * 2)) * 24 + 12 * (1 - k3);
      o.reach = lerp2(a.slot, [x + d * 70 * SC / 1.8, GY - 215 * SC / 1.8 + Math.sin(now / 60) * 14], Math.min(1, k3 * 2.5));
    }
    else { var k4 = (t - T_IN - T_REACH - T_INS - T_WAVE) / T_OUT; if (k4 >= 1) return false; x = a.tx - d * (CW * .75) * k4 * k4; o.dir = -d; o.flower = null; o.reach = null; o.up = 0; }
    o.lift = lift; w20Chibi(ag, x, GY, SC, o);
    return true;
  }
  function man_img(a) { return a.man ? w20Img(a.man.img) : null; }
  function loopA() { if (rafA) return; rafA = requestAnimationFrame(function fr(now) { ag.clearRect(0, 0, CW, CH); actors = actors.filter(function (a) { return step(a, now); }); while (queue.length && actors.length < MAXA && (!fastOn || actors.every(function (a) { return now - a.t0 > T_IN + T_REACH + T_INS; }))) { pendingCount--; spawn(queue.shift()); } if (actors.length || queue.length) rafA = requestAnimationFrame(fr); else { rafA = 0; ag.clearRect(0, 0, CW, CH); if (fastOn) fast(false); text(); } }); }
  pal.addEventListener("click", function (e) {
    var b = e.target.closest(".fl"); if (!b) return; var f = +b.getAttribute("data-i");
    if (list.length + pendingCount >= MAX) { info.textContent = "Đủ " + MAX + " bông rồi, bấm “Xong bó hoa” nha 💐"; return; } /* chỉ cần đúng số bông của một bó */
    if (actors.length >= MAXA) { queue.push(f); pendingCount++; text(); return; } spawn(f);
  });
  /* bấm 1 lần: tự chọn đủ số bông tối thiểu (10) với đủ loại hoa, cắm lần lượt rất nhanh */
  box.querySelector(".bqauto").onclick = function () {
    if (actors.length || queue.length || finaleOn) return;
    var need = min - list.length; if (need <= 0) { info.textContent = "Đủ " + min + " bông rồi, bấm “Xong bó hoa” nha 💐"; return; }
    var pool = []; while (pool.length < need) pool = pool.concat(W20FL.map(function (_, i) { return i; }).sort(function () { return Math.random() - .5; })); pool.length = need;
    /* các anh lần lượt chạy ra cắm từng bông (mỗi bông một anh, đủ 10 anh), chạy nhanh hơn bình thường */
    if (!reduce) fast(true);
    /* lần lượt từng anh một (anh sau chỉ ra khi anh trước đã cắm xong) để không che mặt nhau */
    pool.forEach(function (f) { queue.push(f); pendingCount++; });
    text(); loopA();
  };
  box.querySelector(".bqundo").onclick = function () { if (actors.length) return; list.pop(); upd(); };
  var give = box.querySelector(".bqgive");
  give.onclick = function (e) {
    if (actors.length || queue.length) { info.textContent = "Đợi các anh cắm xong đã nha 😄"; return; }
    if (list.length < min) { info.textContent = "Cắm ít nhất " + min + " bông rồi bấm Xong nha 🌷"; info.classList.remove("shake"); void info.offsetWidth; info.classList.add("shake"); return; }
    if (finaleOn) return; var ev = e, go = function () { finaleOn = false; opt.onDone && opt.onDone(list.slice(), ev); };
    var men = crew.length ? crew : MEN.slice(0, 6); if (reduce || !men.length) { go(); return; }
    finaleOn = true; give.disabled = true; var T0 = performance.now(), n = men.length, T_RUN = 1300, T_CLAP = 3000;
    info.textContent = "Cả nhà vỗ tay chúc mừng chị nào! 👏👏👏";
    /* xếp 2 hàng cong quanh bó hoa, so le để không ai che mặt ai: hàng sau (nhỏ, đứng cao) dàn ngang, hàng trước (to) đứng hai bên */
    var nf = Math.floor(n * .4), nb = n - nf, ppl = men.map(function (m, i) {
      var front = i < nf, x, y, f;
      if (front) { var j = Math.floor(i / 2), lf = i % 2 === 0; x = lf ? 95 + 118 * j : CW - 95 - 118 * j; y = 585; f = 1.12; }
      else { var q = i - nf, th = Math.PI * (nb > 1 ? 1.2 + .6 * q / (nb - 1) : 1.5); x = CX + 285 * Math.cos(th); y = 470 + 205 * Math.sin(th); f = .78; } /* hàng sau xếp vòng cung phía trên bó hoa */
      return { m: m, i: i, x: x, y: y, f: f, back: !front, sx: x < CX ? -110 : CW + 110 };
    }).sort(function (p, q) { return p.y - q.y; });
    (function fr(now) {
      var t = now - T0; ag.clearRect(0, 0, CW, CH); var k = Math.min(1, t / T_RUN), e2 = 1 - Math.pow(1 - k, 2), bq = false;
      function drawP(P, part) {
        var x = P.sx + (P.x - P.sx) * e2, dir = P.x < CX ? 1 : -1, o = { img: w20Img(P.m.img), shirt: P.m.shirt, dir: dir, step: now / 110 + P.i, lift: 0, part: part };
        if (k < 1) { o.run = 1; o.reach = [x + dir * 34 * P.f, P.y - 74 * P.f]; o.lift = Math.abs(Math.sin(now / 120 + P.i)) * 5; }
        else { o.clap = (t - T_RUN) / 95 + P.i * .7; o.lift = Math.abs(Math.sin((t - T_RUN) / 190 + P.i * .5)) * 12; o.step = 1.6; }
        w20Chibi(ag, x, P.y, P.f, o);
      }
      ppl.forEach(function (P) { if (!P.back && !bq) { w20DrawBouquet(ag, CX, CY, SR, list); bq = true; } drawP(P, "body"); });
      if (!bq) w20DrawBouquet(ag, CX, CY, SR, list);
      ppl.forEach(function (P) { drawP(P, "head"); }); /* đầu vẽ sau cùng nên mặt không bị bó hoa hay thân ai che */
      if (t < T_RUN + T_CLAP) requestAnimationFrame(fr); else { ag.clearRect(0, 0, CW, CH); go(); }
    })(T0);
  };
  draw(); text();
  return { list: function () { return list.slice(); }, give: give, canvas: cv, busy: function () { return actors.length > 0; } };
}

/* Vòng quay quà: vẽ một lần, quay bằng CSS (GPU) nên không giật.
   prizes: [{icon, name}] hoặc [[icon, name]]. spin(idx) quay tới đúng ô idx (nếu có). */
function w20Wheel(cv, prizes, onWin, slots) {
  /* slots: thứ tự các ô trên vòng quay, mỗi phần tử là số thứ tự món quà (hoặc -1 = ô “Chúc bạn may mắn”, không bao giờ trúng). Mặc định mỗi quà một ô. */
  slots = slots && slots.length ? slots : prizes.map(function (_, i) { return i; });
  var g = cv.getContext("2d"), n = slots.length, seg = 6.283185 / n, rot = 0, busy = false, COL = ["#ff4f9a", "#ffd76a", "#12a05f", "#a78bfa", "#ff9f43", "#4fc3f7", "#ef5350", "#9ccc65"];
  function ic(p) { return p.icon || p[0]; }
  function draw() {
    var W = cv.width, R = W / 2 - 8, i, k;
    g.clearRect(0, 0, W, W); g.save(); g.translate(W / 2, W / 2);
    for (i = 0; i < n; i++) {
      k = slots[i];
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, -1.5708 + i * seg, -1.5708 + (i + 1) * seg); g.closePath(); g.fillStyle = k < 0 ? "#f3ecd9" : COL[k % COL.length]; g.fill(); g.strokeStyle = "#fff"; g.lineWidth = n > 8 ? 3 : 4; g.stroke();
      g.save(); g.rotate((i + .5) * seg);
      var arc = 6.283185 * R * .66 / n, z = Math.min(R * .3, arc * .92);
      if (k < 0) { /* ô may mắn: trèfle + chữ nhỏ dọc theo bán kính */
        var sp0 = w20Spr("🍀", 96), z0 = Math.min(R * .2, arc * .8); g.drawImage(sp0, -z0 / 2, -R * .8 - z0 / 2, z0, z0);
        g.save(); g.translate(0, -R * .45); g.rotate(-1.5708); g.fillStyle = "#8a6a2a"; g.font = "700 " + Math.round(R * .075) + "px 'Be Vietnam Pro',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("May mắn", 0, 0); g.restore();
      } else { var sp = w20Spr(ic(prizes[k]), 128); g.drawImage(sp, -z / 2, -R * .7 - z / 2, z, z); }
      g.restore();
    }
    g.restore();
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3.2); }
  function ofPrize(p) { var l = [], i; for (i = 0; i < n; i++) if (slots[i] === p) l.push(i); return l; }
  function slotFor(p) { var l = ofPrize(p); return l.length ? l[(Math.random() * l.length) | 0] : ((Math.random() * n) | 0); }
  function target(s) { return (s + .5) * seg; }
  function setAt(p) { var l = ofPrize(p), s = l.length ? l[0] : 0; rot = 6.283 - target(s); cv.style.transform = "rotate(" + rot + "rad)"; }
  function spin(forced) {
    if (busy) return; busy = true;
    var p = forced !== undefined && forced !== null ? forced : (function () { var l = slots.filter(function (x) { return x >= 0; }); return l[(Math.random() * l.length) | 0]; })(), s = slotFor(p), start = rot;
    var finalRot = Math.ceil((start + 6.283 * 5) / 6.283) * 6.283 - target(s) + (Math.random() - .5) * seg * .5, t0 = performance.now(), D = 4600;
    cv.style.willChange = "transform";
    (function step(now) { var t = Math.min(1, (now - t0) / D); rot = start + (finalRot - start) * ease(t); cv.style.transform = "rotate(" + rot + "rad)"; if (t < 1) requestAnimationFrame(step); else { busy = false; cv.style.willChange = "auto"; onWin && onWin(prizes[p], p); } })(t0);
  }
  draw();
  prizes.forEach(function (p) { var e = ic(p); if (/^assets\//.test(e)) { var im = w20Img(e); if (!im.complete) im.addEventListener("load", draw); } }); /* ảnh quà tải xong thì vẽ lại vòng quay */
  return { spin: spin, setAt: setAt };
}

/* Tường lời chúc */
function w20Wall(el, msgs) {
  var C = ["#fff3a8", "#ffd6e6", "#d3f5e1", "#d6e8ff", "#ffe2c2"];
  el.innerHTML = (msgs || []).map(function (m, i) { return '<div class="note2" style="background:' + C[i % C.length] + ";transform:rotate(" + (((i * 37) % 7) - 3) + 'deg)"><p></p><b></b></div>'; }).join("");
  var ns = el.querySelectorAll(".note2");
  (msgs || []).forEach(function (m, i) { ns[i].querySelector("p").textContent = "“" + m.text + "”"; ns[i].querySelector("b").textContent = "— " + m.from; });
}

/* ===== Vòng quay 2 lần: mỗi lần ra 1 món khác nhau, đã chia sẵn cho từng người =====
   opt: {cv, btn, out, prizes, assigned:[a,b]|null, got:[...](đã nhận), onGot(list), onShow(idx,k,fresh), onAll()} */
function w20Wheel2(o) {
  var P = o.prizes, got = (o.got || []).slice(), as = o.assigned;
  var wv = w20Wheel(o.cv, P, function (p, idx) { got.push(idx); o.onGot && o.onGot(got.slice()); render(true); }, o.slots);
  function render(fresh) {
    var h = "";
    got.forEach(function (i, k) { var p = P[i]; h += "<div class='pzrow'><span class='pz'>" + w20IconHTML(p.icon, 44) + "</span><div><small>Quà của bạn</small><b>" + String(p.name).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</b></div></div>"; });
    o.out.innerHTML = h;
    if (got.length >= 1) { o.btn.disabled = true; o.btn.textContent = "✔ Đã quay rồi"; }
    else { o.btn.disabled = false; o.btn.textContent = "🎡 QUAY NGAY"; }
    if (got.length) o.onShow && o.onShow(got[got.length - 1], got.length - 1, !!fresh);
    if (got.length >= 1) o.onAll && o.onAll(!!fresh);
  }
  o.btn.onclick = function () {
    if (got.length >= 1) return; o.btn.disabled = true; o.btn.textContent = "Đang quay…";
    var idx = as && as[got.length] !== undefined ? as[got.length] : (function () { var r; do { r = (Math.random() * P.length) | 0; } while (got.indexOf(r) >= 0); return r; })();
    wv.spin(idx);
  };
  if (got.length) { wv.setAt(got[got.length - 1]); }
  render(false); return { got: function () { return got.slice(); } };
}

/* ===== Thiệp: chữ viết tay màu hồng (Patrick Hand) trên nền hoa 1080×1620 =====
   Bố cục tránh các cụm hoa trên nền: góc trái-trên (x<300,y<310) và góc phải-dưới (x>700, y>1250).
   o: {mode:"chi"|"sep", greet, name, sub, role, wish, bd, prizes:[{icon,name}], from, bq:[...]} */
/* Ngắt dòng cân đối: giữ nguyên số dòng nhưng thu hẹp bề rộng tới mức nhỏ nhất vẫn đủ chỗ, để không có dòng cụt chỉ 1 từ */
function w20WrapBal(g, txt, maxW) {
  var base = w20Wrap(g, txt, maxW), n = base.length; if (n < 2) return base;
  var lo = maxW * .45, hi = maxW, mid, best = base, t;
  for (var k = 0; k < 14; k++) { mid = (lo + hi) / 2; t = w20Wrap(g, txt, mid); if (t.length <= n) { best = t; hi = mid; } else lo = mid; }
  return best;
}
var W20INK = "#b3265f", W20HW = "'Patrick Hand','Segoe Print','Bradley Hand',cursive";
function w20Ink(g, txt, x, y, px, bold) { /* chữ viết tay đen; bold = đè nét cho đậm như bút bi */
  g.font = px + "px " + W20HW; g.fillStyle = W20INK; g.fillText(txt, x, y);
  if (bold) { g.strokeStyle = W20INK; g.lineWidth = Math.max(1, px / 38); g.lineJoin = "round"; g.strokeText(txt, x, y); }
}
function w20Wavy(g, x1, x2, y, col) { g.save(); g.strokeStyle = col; g.lineWidth = 4; g.lineCap = "round"; g.beginPath(); g.moveTo(x1, y); for (var x = x1, k = 0; x < x2; x += 18, k++) g.quadraticCurveTo(x + 9, y + (k % 2 ? 7 : -7), Math.min(x + 18, x2), y); g.stroke(); g.restore(); }
/* ===== 10 mẫu thiệp: nền, khung, hoa màu nước thật (tách từ ảnh gốc) đổi tông/đổi chỗ, hạt lấp lánh, ren, bướm… Mẫu 0 = hoa hồng gốc (mặc định) ===== */
var W20THEMES = [
  { name: "Hoa hồng", bg: "flower", ink: "#b3265f", acc: "#a8324f", acc2: "#c8506f", g1: "#d9728b", g2: "#9c2d4b", chip: "rgba(255,255,255,.84)", pv: "linear-gradient(135deg,#fde3ea,#e58aa2)", em: "🌹" },
  { name: "Vàng kim sang trọng", bg: "paper", c1: "#fffaf0", c2: "#fbe9c6", hue: 0, sat: 1, bri: 1, frame: "gold", spark: "#e8b64a", ink: "#8a5a05", acc: "#9a6a0a", acc2: "#c99a2e", g1: "#f2c14e", g2: "#9a6a0a", chip: "rgba(255,255,255,.86)", chipLine: "rgba(201,154,46,.85)", pv: "linear-gradient(135deg,#fff3d6,#e3b24d)", em: "👑" },
  { name: "Xanh ngọc ren", bg: "paper", c1: "#f2fbf8", c2: "#d3efe5", hue: 188, sat: 1.05, bri: 1, frame: "lace", spark: "#ffffff", dots: "#3a9a85", ink: "#17665a", acc: "#17665a", acc2: "#3a9a85", g1: "#62c4af", g2: "#17665a", chip: "rgba(255,255,255,.88)", pv: "linear-gradient(135deg,#e2f7f0,#4bb39d)", em: "🍃" },
  { name: "Tím mộng mơ", bg: "dream", c1: "#f5eefc", c2: "#e1d4f6", blobs: ["#c8b0f0", "#f0b8e0", "#b8c8f6"], hue: -72, sat: 1.05, bri: 1, frame: "double", fcol: "#ffffff", fly: "#a07ad8", ink: "#4d2a8c", acc: "#4d2a8c", acc2: "#8a5fd0", g1: "#a98be0", g2: "#4d2a8c", chip: "rgba(255,255,255,.86)", pv: "linear-gradient(135deg,#ece2fb,#9a78dc)", em: "🦋" },
  { name: "Đỏ valentine", bg: "hearts", c1: "#ffeef0", c2: "#f9bcc6", hue: -14, sat: 1.55, bri: .93, frame: "gold", spark: "#ffffff", ink: "#a31224", acc: "#a31224", acc2: "#d03a4e", g1: "#e85a6c", g2: "#8e0f1f", chip: "rgba(255,255,255,.88)", chipLine: "rgba(201,154,46,.85)", pv: "linear-gradient(135deg,#ffe3e6,#e0485c)", em: "❤️" },
  { name: "Trời xanh mây", bg: "sky", c1: "#cfe8ff", c2: "#fdfcff", hue: 212, sat: 1.1, bri: 1, frame: "double", fcol: "#ffffff", spark: "#ffffff", ink: "#1c4f9c", acc: "#1c4f9c", acc2: "#4a86d6", g1: "#79a8e6", g2: "#1c4f9c", chip: "rgba(255,255,255,.88)", pv: "linear-gradient(135deg,#d9ebff,#6fa3e6)", em: "☁️" },
  { name: "Hoàng hôn cam", bg: "sunset", c1: "#fff2e2", c2: "#ffcfae", hue: 22, sat: 1.15, bri: 1, frame: "gold", spark: "#fff3c4", ink: "#a24412", acc: "#a24412", acc2: "#e07b3d", g1: "#f4a066", g2: "#a24412", chip: "rgba(255,255,255,.86)", chipLine: "rgba(201,154,46,.85)", pv: "linear-gradient(135deg,#ffe6cf,#ee8c50)", em: "🌅" },
  { name: "Lá xanh botanical", bg: "paper", c1: "#fbfdf6", c2: "#e8f2dc", hue: 0, sat: 1, bri: 1, leaves: true, frame: "thin", fcol: "#5f9a45", ink: "#2c5a24", acc: "#2c5a24", acc2: "#5f9a45", g1: "#86bd6a", g2: "#2c5a24", chip: "rgba(255,255,255,.88)", pv: "linear-gradient(135deg,#eaf5dc,#6fae55)", em: "🌿" },
  { name: "Kraft vintage", bg: "kraft", c1: "#f6ead3", c2: "#ecd9b8", hue: -18, sat: .55, bri: .96, frame: "stitch", ink: "#6b3a1f", acc: "#8a4b24", acc2: "#b0703d", g1: "#c98a54", g2: "#7a4020", chip: "rgba(255,255,255,.72)", pv: "linear-gradient(135deg,#f6e9d2,#c9a26b)", em: "🍂" },
  { name: "Đêm vàng lấp lánh", bg: "night", hue: 62, sat: 1.4, bri: 1.25, frame: "gold", ink: "#ffe9a6", acc: "#ffd76a", acc2: "#f6c453", g1: "#fff1b8", g2: "#f0b83a", chip: "rgba(255,255,255,.12)", chipLine: "rgba(255,215,106,.8)", pv: "linear-gradient(135deg,#27346b,#0e1530)", em: "✨" }
];
function w20Hex2rgba(h, a) { var n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
function w20Rnd(k) { var x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
/* hoa màu nước thật: cắt từ ảnh gốc (toạ độ ảnh 1024×1536), đổi tông bằng ma trận xoay màu */
var W20CROP = { A: [0, 0, 330, 340], B: [400, 980, 624, 556], C: [730, 640, 294, 360] }, W20CROPC = {};
function w20Crop(key, hue, sat, bri, glow) {
  var k = key + "|" + hue + "|" + sat + "|" + bri + "|" + (glow ? 1 : 0); if (W20CROPC[k]) return W20CROPC[k];
  var img = w20Img("assets/card-bg.webp"); if (!img.complete || !img.naturalWidth) return null;
  var r = W20CROP[key], c = document.createElement("canvas"); c.width = r[2]; c.height = r[3]; var g = c.getContext("2d"); g.drawImage(img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
  {
    try {
      var d = g.getImageData(0, 0, r[2], r[3]), p = d.data, cs = Math.cos(hue * Math.PI / 180), sn = Math.sin(hue * Math.PI / 180), i, R, G, B, nr, ng, nb, L, a;
      var m0 = [.213 + cs * .787 - sn * .213, .715 - cs * .715 - sn * .715, .072 - cs * .072 + sn * .928, .213 - cs * .213 + sn * .143, .715 + cs * .285 + sn * .14, .072 - cs * .072 - sn * .283, .213 - cs * .213 - sn * .787, .715 - cs * .715 + sn * .715, .072 + cs * .928 + sn * .072];
      for (i = 0; i < p.length; i += 4) {
        R = p[i]; G = p[i + 1]; B = p[i + 2];
        nr = m0[0] * R + m0[1] * G + m0[2] * B; ng = m0[3] * R + m0[4] * G + m0[5] * B; nb = m0[6] * R + m0[7] * G + m0[8] * B;
        L = .3 * nr + .59 * ng + .11 * nb; var s = sat || 1; nr = L + (nr - L) * s; ng = L + (ng - L) * s; nb = L + (nb - L) * s;
        var bb = bri || 1; nr *= bb; ng *= bb; nb *= bb;
        if (glow) { a = Math.max(0, Math.min(1, (255 - Math.min(R, G, B) - 16) / 50)); p[i + 3] = a * 255; nr = Math.min(255, nr * 1.05 + 20); ng = Math.min(255, ng * 1.05 + 10); } /* nền sáng → trong suốt, hoa phát sáng trên nền tối */
        else { a = Math.max(0, Math.min(1, (255 - Math.min(R, G, B) - 9) / 20)); p[i + 3] = a * 255; } /* nền trắng của ảnh → trong suốt, hết viền khung chữ nhật */
        p[i] = nr < 0 ? 0 : nr > 255 ? 255 : nr; p[i + 1] = ng < 0 ? 0 : ng > 255 ? 255 : ng; p[i + 2] = nb < 0 ? 0 : nb > 255 ? 255 : nb;
      }
      g.putImageData(d, 0, 0);
    } catch (e) {}
  }
  return (W20CROPC[k] = c);
}
function w20Sparkle(g, x, y, r, col, al) { g.save(); g.translate(x, y); g.globalAlpha = al == null ? 1 : al; g.fillStyle = col; g.beginPath(); for (var k = 0; k < 8; k++) { var a = k * .7854, rr = k % 2 ? r * .22 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore(); }
function w20Sparkles(g, W, H, col, n, seed) { for (var i = 0; i < n; i++) w20Sparkle(g, 60 + w20Rnd(seed + i) * (W - 120), 60 + w20Rnd(seed + i + 70) * (H - 120), 6 + w20Rnd(seed + i + 9) * 16, col, .35 + w20Rnd(seed + i + 3) * .55); }
function w20Bokeh(g, W, H, cols, n, seed) { for (var i = 0; i < n; i++) { var x = w20Rnd(seed + i) * W, y = w20Rnd(seed + i + 40) * H, r = 18 + w20Rnd(seed + i + 80) * 70, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, w20Hex2rgba(cols[i % cols.length], .32)); gr.addColorStop(1, w20Hex2rgba(cols[i % cols.length], 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill(); } }
function w20Grain(g, W, H, n, col, seed) { for (var i = 0; i < n; i++) { g.fillStyle = col + (0.03 + w20Rnd(seed + i + 3) * .06) + ")"; g.fillRect(w20Rnd(seed + i) * W, w20Rnd(seed + i + 900) * H, 1.5 + w20Rnd(seed + i + 7) * 2.5, 1.5 + w20Rnd(seed + i + 11) * 2.5); } }
function w20Vignette(g, W, H, a) { var v = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(60,30,20," + a + ")"); g.fillStyle = v; g.fillRect(0, 0, W, H); }
function w20GoldFrame(g, W, H) {
  var gd = g.createLinearGradient(0, 0, W, H); gd.addColorStop(0, "#a8751d"); gd.addColorStop(.3, "#f7e29a"); gd.addColorStop(.55, "#d9a93d"); gd.addColorStop(.8, "#f3d680"); gd.addColorStop(1, "#8e6a1b");
  g.save(); g.strokeStyle = gd; g.lineWidth = 6; w20Rr(g, 38, 38, W - 76, H - 76, 28); g.stroke(); g.lineWidth = 2; w20Rr(g, 56, 56, W - 112, H - 112, 18); g.stroke();
  [[56, 56, 1, 1], [W - 56, 56, -1, 1], [56, H - 56, 1, -1], [W - 56, H - 56, -1, -1]].forEach(function (c) { /* hoa văn góc */
    g.save(); g.translate(c[0], c[1]); g.scale(c[2], c[3]); g.strokeStyle = gd; g.fillStyle = gd; g.lineWidth = 3;
    g.beginPath(); g.moveTo(14, 70); g.bezierCurveTo(14, 30, 30, 14, 70, 14); g.stroke(); g.beginPath(); g.moveTo(26, 70); g.bezierCurveTo(26, 40, 40, 26, 70, 26); g.stroke();
    g.beginPath(); g.arc(14, 14, 7, 0, 6.283); g.fill(); g.beginPath(); g.moveTo(80, 14); g.lineTo(88, 20); g.lineTo(80, 26); g.lineTo(72, 20); g.closePath(); g.fill(); g.beginPath(); g.moveTo(14, 80); g.lineTo(20, 88); g.lineTo(26, 80); g.lineTo(20, 72); g.closePath(); g.fill(); g.restore();
  });
  g.restore();
}
function w20LaceFrame(g, W, H, col, dot) {
  g.save(); g.fillStyle = col; g.strokeStyle = "rgba(0,0,0,.08)"; g.lineWidth = 1.5; var r = 24, n;
  for (n = r; n < W; n += r * 2) { g.beginPath(); g.arc(n, 0, r, 0, 3.1416); g.fill(); g.stroke(); g.beginPath(); g.arc(n, H, r, 3.1416, 6.2832); g.fill(); g.stroke(); }
  for (n = r; n < H; n += r * 2) { g.beginPath(); g.arc(0, n, r, -1.5708, 1.5708); g.fill(); g.stroke(); g.beginPath(); g.arc(W, n, r, 1.5708, 4.7124); g.fill(); g.stroke(); }
  g.strokeStyle = dot; g.lineWidth = 2; g.setLineDash([2, 12]); g.lineCap = "round"; w20Rr(g, 52, 52, W - 104, H - 104, 22); g.stroke(); g.restore();
}
function w20Butterfly(g, x, y, sc, c1, c2, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
  [[-1, 1], [1, 1]].forEach(function (s) { var gr = g.createLinearGradient(0, 0, s[0] * 60, -30); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(s[0] * 30, -64, s[0] * 78, -50, s[0] * 64, -4); g.bezierCurveTo(s[0] * 56, 10, s[0] * 20, 6, 0, 0); g.fill(); g.beginPath(); g.moveTo(0, 2); g.bezierCurveTo(s[0] * 40, 6, s[0] * 54, 40, s[0] * 30, 52); g.bezierCurveTo(s[0] * 12, 56, s[0] * 4, 24, 0, 2); g.fill(); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s[0] * 40, -30, s[0] * 60, -22); g.stroke(); });
  g.fillStyle = "#3a2a3a"; g.beginPath(); g.ellipse(0, 6, 4, 26, 0, 0, 6.283); g.fill(); g.strokeStyle = "#3a2a3a"; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -18); g.quadraticCurveTo(-10, -36, -18, -40); g.moveTo(0, -18); g.quadraticCurveTo(10, -36, 18, -40); g.stroke(); g.restore();
}
function w20Heart(g, x, y, s, col) { g.save(); g.translate(x, y); g.fillStyle = col; g.beginPath(); g.moveTo(0, s * .3); g.bezierCurveTo(-s, -s * .5, -s * .4, -s, 0, -s * .4); g.bezierCurveTo(s * .4, -s, s, -s * .5, 0, s * .3); g.fill(); g.restore(); }
function w20Cloud(g, x, y, s) { var gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; [[0, 0, 1], [.7, .15, .8], [-.7, .2, .75], [.2, -.3, .7]].forEach(function (p) { g.beginPath(); g.arc(x + p[0] * s, y + p[1] * s, s * p[2] * .8, 0, 6.283); g.fill(); }); }
function w20ThemeBg(g, T, W, H) {
  var i, r, rnd = w20Rnd, A, B, C;
  if (T.bg === "flower") {
    var bg = w20Img("assets/card-bg.webp");
    if (bg.complete && bg.naturalWidth) g.drawImage(bg, 0, 0, W, H); else { g.fillStyle = "#fff8f5"; g.fillRect(0, 0, W, H); }
    return;
  }
  /* ---- nền theo mẫu ---- */
  var gl = T.bg === "night";
  if (gl) { var ng = g.createLinearGradient(0, 0, 0, H); ng.addColorStop(0, "#0b1230"); ng.addColorStop(.55, "#1f2b63"); ng.addColorStop(1, "#4a2a6b"); g.fillStyle = ng; g.fillRect(0, 0, W, H); }
  else { var bgr = g.createLinearGradient(0, 0, W * .35, H); bgr.addColorStop(0, T.c1); bgr.addColorStop(1, T.c2); g.fillStyle = bgr; g.fillRect(0, 0, W, H); }
  if (T.bg === "paper") { w20Grain(g, W, H, 700, "rgba(120,100,80,", 5); }
  if (T.bg === "dream") { (T.blobs || []).forEach(function (c, q) { var x = [220, 880, 540][q % 3], y = [380, 1000, 1400][q % 3], rg = g.createRadialGradient(x, y, 0, x, y, 520); rg.addColorStop(0, w20Hex2rgba(c, .55)); rg.addColorStop(1, w20Hex2rgba(c, 0)); g.fillStyle = rg; g.fillRect(0, 0, W, H); }); w20Bokeh(g, W, H, ["#ffffff", "#e6d6ff", "#ffd6f0"], 22, 3); }
  if (T.bg === "hearts") { for (i = 0; i < 34; i++) w20Heart(g, rnd(i + 3) * W, rnd(i + 55) * H, 14 + rnd(i + 8) * 36, w20Hex2rgba(i % 3 ? "#ffffff" : "#e0485c", .16 + rnd(i) * .2)); w20Bokeh(g, W, H, ["#ffffff", "#ff9aa8"], 14, 8); }
  if (T.bg === "sky") { w20Cloud(g, 840, 260, 120); w20Cloud(g, 200, 520, 100); w20Cloud(g, 900, 980, 130); w20Cloud(g, 260, 1180, 110); w20Cloud(g, 640, 1440, 150); for (i = 0; i < 6; i++) { g.save(); g.translate(120 + rnd(i) * 860, 220 + rnd(i + 9) * 600); g.strokeStyle = "rgba(60,90,140,.35)"; g.lineWidth = 3; g.beginPath(); g.moveTo(-18, 0); g.quadraticCurveTo(-9, -12, 0, 0); g.quadraticCurveTo(9, -12, 18, 0); g.stroke(); g.restore(); } }
  if (T.bg === "sunset") { var sg = g.createRadialGradient(W * .8, H * .08, 0, W * .8, H * .08, 900); sg.addColorStop(0, "rgba(255,232,160,.75)"); sg.addColorStop(.4, "rgba(255,190,140,.3)"); sg.addColorStop(1, "rgba(255,190,140,0)"); g.fillStyle = sg; g.fillRect(0, 0, W, H); g.save(); g.translate(W * .8, H * .08); for (i = 0; i < 14; i++) { g.rotate(.45); g.fillStyle = "rgba(255,240,200,.09)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(1400, -60); g.lineTo(1400, 60); g.fill(); } g.restore(); }
  if (T.bg === "kraft") { w20Grain(g, W, H, 900, "rgba(110,75,40,", 5); for (i = 0; i < 30; i++) { g.strokeStyle = "rgba(120,85,50,.06)"; g.lineWidth = 2; g.beginPath(); var yy = rnd(i + 2) * H; g.moveTo(0, yy); g.lineTo(W, yy + (rnd(i) - .5) * 40); g.stroke(); } }
  if (gl) { for (i = 0; i < 110; i++) { var sx = rnd(i + 5) * W, sy = rnd(i + 77) * H, sr = .8 + rnd(i + 9) * 2.8; g.fillStyle = "rgba(255,240,190," + (.3 + rnd(i + 13) * .65) + ")"; g.beginPath(); g.arc(sx, sy, sr, 0, 6.283); g.fill(); } w20Sparkles(g, W, H, "#ffe08a", 26, 40); g.fillStyle = "#fff2c4"; g.beginPath(); g.arc(150, 190, 70, 0, 6.283); g.fill(); g.fillStyle = "#16204a"; g.beginPath(); g.arc(180, 172, 64, 0, 6.283); g.fill(); }
  /* ---- hoa màu nước thật (đổi tông theo mẫu), đặt như bản gốc: cụm lớn góc phải-dưới, cụm nhỏ góc trái-trên ---- */
  var sc = 1.0547, hue = T.hue || 0, sat = T.sat || 1, bri = T.bri || 1;
  A = w20Crop("A", hue, sat, bri, gl); B = w20Crop("B", hue, sat, bri, gl); C = w20Crop("C", hue, sat, bri, gl);
  g.save();
  if (gl) { g.shadowColor = "rgba(255,200,90,.55)"; g.shadowBlur = 28; } else g.globalCompositeOperation = "multiply";
  if (T.leaves && C) { var Cg = w20Crop("C", 95, 1.7, .85); if (Cg) { g.save(); g.translate(-30, 1330); g.rotate(-.6); g.drawImage(Cg, 0, 0, 294 * .95, 360 * .95); g.restore(); g.save(); g.translate(430, 1700); g.rotate(-1.55); g.drawImage(Cg, 0, 0, 294 * .8, 360 * .8); g.restore(); } }
  if (A) g.drawImage(A, 0, 0, A.width * sc, A.height * sc);
  if (B) g.drawImage(B, 400 * sc, 980 * sc, B.width * sc, B.height * sc);
  if (false && C) { g.save(); g.translate(W + 6, 840); g.scale(-1, 1); g.globalAlpha = .9; g.drawImage(C, 0, 0, C.width * .8, C.height * .8); g.restore(); }
  g.restore();
  /* ---- khung & chi tiết ---- */
  if (T.frame === "gold") w20GoldFrame(g, W, H);
  if (T.frame === "lace") w20LaceFrame(g, W, H, "rgba(255,255,255,.95)", T.dots || "#999");
  if (T.frame === "double") { g.save(); g.strokeStyle = T.fcol || "#fff"; g.lineWidth = 5; w20Rr(g, 40, 40, W - 80, H - 80, 30); g.stroke(); g.lineWidth = 2; w20Rr(g, 58, 58, W - 116, H - 116, 20); g.stroke(); g.restore(); }
  if (T.frame === "thin") { g.save(); g.strokeStyle = w20Hex2rgba(T.fcol || "#5f9a45", .8); g.lineWidth = 3; w20Rr(g, 44, 44, W - 88, H - 88, 26); g.stroke(); g.restore(); }
  if (T.frame === "stitch") { g.save(); g.strokeStyle = "#a8763e"; g.lineWidth = 4; g.setLineDash([18, 12]); g.lineCap = "round"; w20Rr(g, 46, 46, W - 92, H - 92, 30); g.stroke(); g.setLineDash([]); [[120, 70, -.5], [W - 120, H - 70, -.5]].forEach(function (t) { g.save(); g.translate(t[0], t[1]); g.rotate(t[2]); g.fillStyle = "rgba(255,214,170,.85)"; g.fillRect(-70, -22, 140, 44); g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 3; g.beginPath(); g.moveTo(-60, -10); g.lineTo(60, -10); g.moveTo(-60, 10); g.lineTo(60, 10); g.stroke(); g.restore(); }); g.restore(); }
  if (T.spark) w20Sparkles(g, W, H, T.spark, 22, 11);
  if (T.bg === "dream") { w20Butterfly(g, 930, 330, .9, "#c9a8f5", "#8a5fd0", .4); w20Butterfly(g, 120, 640, .7, "#f4b8e6", "#a07ad8", -.35); w20Butterfly(g, 960, 1010, .6, "#b8c8f6", "#7a8ae0", .6); }
  if (T.bg === "sunset") { w20Butterfly(g, 940, 520, .7, "#ffd27a", "#f08a4b", .5); }
  if (T.bg === "sky") { w20Butterfly(g, 960, 700, .7, "#ffffff", "#8fb8f2", .3); }
  w20Vignette(g, W, H, gl ? .25 : .08);
}
function w20DrawCard(g, o) {
  var W = 1080, H = 1620, i, DS = "'Dancing Script','Brush Script MT',cursive", PF = "'Playfair Display',Georgia,serif";
  var T = W20THEMES[o.theme >= 0 && o.theme < W20THEMES.length ? o.theme : 0], ROSE = T.acc, ROSE2 = T.acc2; W20INK = T.ink;
  g.save(); g.textBaseline = "alphabetic"; g.textAlign = "center";
  w20ThemeBg(g, T, W, H);
  function ls(px) { if ("letterSpacing" in g) g.letterSpacing = px + "px"; }
  /* ---- đầu thiệp (lệch phải để tránh hoa góc trái-trên) ---- */
  var hx = 650; ls(5); w20Ink(g, "PHÒNG PTSPBL  ·  20.10." + new Date().getFullYear(), hx, 128, 30, 1); ls(0);
  var hs = 116, hw = 700; g.font = "700 " + hs + "px " + DS; while (g.measureText("Happy Women's Day").width > hw && hs > 70) { hs -= 4; g.font = "700 " + hs + "px " + DS; }
  g.fillStyle = ROSE2; g.shadowColor = w20Hex2rgba(ROSE2, .25); g.shadowBlur = 10; g.shadowOffsetY = 3; g.fillText("Happy Women's Day", hx, 262); g.shadowColor = "transparent"; g.shadowBlur = 0; g.shadowOffsetY = 0;
  var gr = g.createLinearGradient(0, 290, 0, 470); gr.addColorStop(0, T.g1); gr.addColorStop(1, T.g2);
  g.shadowColor = w20Hex2rgba(ROSE, .25); g.shadowBlur = 22; g.shadowOffsetY = 8; g.fillStyle = gr; g.font = "700 184px " + PF; g.fillText("20.10", 600, 440); g.shadowColor = "transparent"; g.shadowBlur = 0; g.shadowOffsetY = 0;
  w20Ink(g, o.greet || "Gửi chị em thương mến", 560, 508, 36, 0); var y = 508;
  /* ---- tên ---- */
  var nm = o.name || "Chị em Phòng PTSPBL", fs = 104; g.font = fs + "px " + W20HW;
  while (g.measureText(nm).width > 780 && fs > 50) { fs -= 4; g.font = fs + "px " + W20HW; }
  y += fs * .82 + 22; w20Ink(g, nm, 560, y, fs, 1);
  if (o.sub) { y += 50; var ss = 30; g.font = ss + "px " + W20HW; while (g.measureText(o.sub).width > 800 && ss > 22) { ss--; g.font = ss + "px " + W20HW; } w20Ink(g, o.sub, 560, y, ss, 0); }
  /* ---- danh hiệu vui: chữ viết tay + nét lượn gạch chân ---- */
  var rl = o.role || "", rs = 38;
  if (rl) {
    g.font = rs + "px " + W20HW; while (g.measureText(rl).width > 800 && rs > 28) { rs--; g.font = rs + "px " + W20HW; }
    y += 78; var rw = g.measureText(rl).width; w20Ink(g, rl, 560, y, rs, 0); w20Wavy(g, 560 - rw / 2 - 6, 560 + rw / 2 + 6, y + 18, ROSE2); y += 18;
  }
  if (o.bd) { y += 58; w20Ink(g, "🎂 Chúc mừng sinh nhật tháng 10 nha!", 560, y, 32, 0); }
  /* ---- lời chúc ---- */
  y += 112; var wsz = 46, WX = 470, WW = 640; g.font = wsz + "px " + W20HW; var txt = o.wish || "", wl = w20WrapBal(g, txt, WW);
  while (wl.length > 5 && wsz > 32) { wsz -= 2; g.font = wsz + "px " + W20HW; wl = w20WrapBal(g, txt, WW); }
  var lh = wsz * 1.5, ny = Math.min(wl.length, 8), mw = 0;
  g.font = wsz + "px " + W20HW; for (i = 0; i < ny; i++) mw = Math.max(mw, g.measureText(wl[i]).width);
  var lw = ny ? g.measureText(wl[ny - 1]).width : 0, qc = w20Hex2rgba(ROSE2, .6);
  g.fillStyle = qc; g.font = "700 110px " + PF; g.textAlign = "right"; g.fillText("“", WX - mw / 2 - 6, y + 24); g.textAlign = "center";
  for (i = 0; i < ny; i++) { g.save(); g.translate(WX, y + i * lh); g.rotate((((i * 7) % 5) - 2) * .0045); w20Ink(g, wl[i], 0, 0, wsz, 0); g.restore(); } /* mỗi dòng nghiêng nhẹ cho giống tay viết */
  var wend = y + (ny - 1) * lh; g.fillStyle = qc; g.font = "700 110px " + PF; g.textAlign = "left"; g.fillText("”", Math.min(WX + WW / 2 + 8, WX + lw / 2 + 6), wend + 54); g.textAlign = "center";
  /* ---- ký tên ---- */
  y = wend + 104; var sg = "Thương mến, " + (o.from || ""), sgs = 44; g.font = sgs + "px " + W20HW; while (g.measureText(sg).width > WW - 40 && sgs > 28) { sgs -= 2; g.font = sgs + "px " + W20HW; }
  w20Ink(g, sg, WX, y, sgs, 1); var sgw = g.measureText(sg).width; g.fillStyle = ROSE2; g.font = sgs + "px " + W20HW; g.textAlign = "left"; g.fillText("♥", WX + sgw / 2 + 12, y); g.textAlign = "center";
  /* ---- quà đã nhận (to, ở giữa) ---- */
  var pz = (o.prizes || []).slice(0, 2);
  if (pz.length) {
    y += 40; var px = 130, py2 = y, ph = 80; g.textAlign = "left";
    pz.forEach(function (p) {
      var isImg = /^assets\//.test(p.icon), t = isImg ? p.name : p.icon + "  " + p.name, ps = 42; g.font = ps + "px " + W20HW; while (g.measureText(t).width > (isImg ? 400 : 480) && ps > 24) { ps--; g.font = ps + "px " + W20HW; }
      var im = isImg ? w20Img(p.icon) : null, ih = isImg ? 130 : 0, iw = isImg && im.naturalWidth ? ih * im.naturalWidth / im.naturalHeight : 0, ext = iw ? iw + 12 : 0;
      var tw = g.measureText(t).width + 60 + ext, rowH = isImg ? 150 : ph; if (pz.length === 1) px = 640 - tw / 2; else if (px + tw > 780 && px > 130) { px = 130; py2 += ph + 10; }
      g.fillStyle = T.chip; g.strokeStyle = T.chipLine || w20Hex2rgba(ROSE, .6); g.lineWidth = 2.4; w20Rr(g, px, py2, tw, rowH, rowH / 2); g.fill(); g.stroke();
      if (iw) g.drawImage(im, px + 26, py2 + (rowH - ih) / 2, iw, ih);
      w20Ink(g, t, px + 30 + ext, py2 + rowH / 2 + ps * .33, ps, 0); px += tw + 12; if (isImg) ph = Math.max(ph, rowH);
    });
    g.textAlign = "center"; y = py2 + ph;
  }
  /* ---- bó hoa tự cắm (to): góc trái-dưới, không chạm chữ ---- */
  if (o.bq && o.bq.length) { var S = 160, cy = Math.max(1395, y + 0.95 * S + 12); if (cy + S * 1.25 > H - 14) cy = H - 14 - S * 1.25; w20DrawBouquet(g, 215, cy, S, o.bq); }
  g.restore();
}

/* Bấm vào khung ảnh tập thể để xem to */
document.addEventListener("click", function (e) {
  var f = e.target.closest && e.target.closest(".frame"); if (!f) return;
  var d = document.createElement("div"); d.className = "lbx"; d.innerHTML = '<img src="' + f.querySelector("img").src + '" alt="">'; d.onclick = function () { d.remove(); }; document.body.appendChild(d);
});

/* Các mô-đun dùng chung: cắm hoa, vòng quay quà, tường lời chúc */
var W20FL = (typeof W20FN !== "undefined" ? W20FN : ["a", "b", "c", "d", "e", "f", "g", "h"]); /* 8 loại hoa vẽ trong flowers.js */
/* vị trí từng bông trong bó (x, y theo nửa chiều rộng; s = độ to). Bông đặt trước nằm giữa. */
var W20SLOT = [[0, -.3, 1.2], [-.38, -.22, 1.04], [.38, -.2, 1.04], [-.2, -.6, 1.06], [.22, -.58, 1.06], [-.6, -.5, .92], [.6, -.48, .92],
  [0, -.9, .96], [-.4, -.86, .86], [.42, -.84, .86], [-.74, -.2, .84], [.74, -.18, .84]];
var W20SPR = {};
function w20Spr(e, px) { /* emoji vẽ sẵn thành hình (nét, nhẹ) */
  var k = e + px; if (W20SPR[k]) return W20SPR[k];
  var c = document.createElement("canvas"); c.width = c.height = px; var g = c.getContext("2d");
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
  opt = typeof opt === "function" ? { onChange: opt } : (opt || {}); var list = (opt.start || []).slice(), MAX = W20SLOT.length, min = opt.min || 1;
  var MEN = (typeof W20CFG !== "undefined" && W20CFG.men) || [], CW = 680, CH = 610, CX = 340, CY = 409, SR = 135, GY = 590, SC = 1.8;
  box.innerHTML = '<div class="bqpal"></div><div class="bqstage"><canvas class="bqcv" width="' + CW + '" height="' + CH + '"></canvas><canvas class="bqan" width="' + CW + '" height="' + CH + '"></canvas></div><div class="bqinfo"></div>'
    + '<div class="acts"><button type="button" class="btn ghost bqundo" style="font-size:15px;padding:10px 18px">↩️ Bỏ bông vừa cắm</button><button type="button" class="btn pink bqgive" style="font-size:16px;padding:12px 22px">💐 Xong bó hoa</button></div>';
  var pal = box.querySelector(".bqpal"), cv = box.querySelector(".bqcv"), g = cv.getContext("2d"), an = box.querySelector(".bqan"), ag = an.getContext("2d"), info = box.querySelector(".bqinfo"), raf = 0, rafA = 0;
  MEN.forEach(function (m) { w20Img(m.img); });
  pal.innerHTML = W20FL.map(function (f, i) { return '<button type="button" class="fl" data-i="' + i + '" aria-label="Thêm hoa ' + f + '"><img alt="" src="' + w20FlowerSprite(i).toDataURL() + '"><span>' + f + "</span></button>"; }).join("");
  var crew = [], finaleOn = false, actors = [], queue = [], nextMan = 0, side = 1, reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches, pendingCount = 0;
  function draw() { g.clearRect(0, 0, CW, CH); w20DrawBouquet(g, CX, CY, SR, list); }
  function text() {
    var n = list.length + pendingCount;
    info.textContent = !n ? "Chạm vào loại hoa để các anh chạy ra cắm giúp nha (tối đa " + MAX + " bông)" : n < min ? "Đã có " + n + " bông, cần thêm " + (min - n) + " bông nữa là đẹp" : "Đã có " + n + "/" + MAX + " bông. Đẹp rồi đó!";
  }
  function upd() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); text(); opt.onChange && opt.onChange(list.slice()); }
  function plant(a) { if (a.man && crew.indexOf(a.man) < 0) crew.push(a.man); if (list.length >= MAX) list.shift(); list.push(a.f); pendingCount = Math.max(0, pendingCount - 1); upd(); }
  /* hoạt cảnh: anh chạy ra, đứng cạnh bó, giơ tay cắm bông hoa vào đúng chỗ rồi vẫy (ms) */
  var T_IN = 1500, T_REACH = 800, T_INS = 900, T_WAVE = 800, T_OUT = 1000;
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
  function loopA() { if (rafA) return; rafA = requestAnimationFrame(function fr(now) { ag.clearRect(0, 0, CW, CH); actors = actors.filter(function (a) { return step(a, now); }); while (queue.length && actors.length < 4) { pendingCount--; spawn(queue.shift()); } if (actors.length) rafA = requestAnimationFrame(fr); else { rafA = 0; ag.clearRect(0, 0, CW, CH); text(); } }); }
  pal.addEventListener("click", function (e) {
    var b = e.target.closest(".fl"); if (!b) return; var f = +b.getAttribute("data-i");
    if (actors.length >= 4) { queue.push(f); pendingCount++; text(); return; } spawn(f);
  });
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
function w20Wheel(cv, prizes, onWin) {
  var g = cv.getContext("2d"), n = prizes.length, seg = 6.283185 / n, rot = 0, busy = false, COL = ["#ff4f9a", "#ffd76a", "#12a05f", "#a78bfa", "#ff9f43", "#4fc3f7", "#ef5350", "#9ccc65"];
  function ic(p) { return p.icon || p[0]; }
  function draw() {
    var W = cv.width, R = W / 2 - 8, i;
    g.clearRect(0, 0, W, W); g.save(); g.translate(W / 2, W / 2);
    for (i = 0; i < n; i++) {
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, -1.5708 + i * seg, -1.5708 + (i + 1) * seg); g.closePath(); g.fillStyle = COL[i % COL.length]; g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 4; g.stroke();
      g.save(); g.rotate((i + .5) * seg); var sp = w20Spr(ic(prizes[i]), 128), z = R * .3; g.drawImage(sp, -z / 2, -R * .66 - z / 2, z, z); g.restore();
    }
    g.restore();
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3.2); }
  function target(idx) { return (idx + .5) * seg; }
  function setAt(idx) { rot = 6.283 - target(idx); cv.style.transform = "rotate(" + rot + "rad)"; }
  function spin(forced) {
    if (busy) return; busy = true; var idx = forced !== undefined && forced !== null ? forced : (Math.random() * n) | 0, start = rot;
    var finalRot = Math.ceil((start + 6.283 * 5) / 6.283) * 6.283 - target(idx) + (Math.random() - .5) * seg * .6, t0 = performance.now(), D = 4600;
    cv.style.willChange = "transform";
    (function step(now) { var t = Math.min(1, (now - t0) / D); rot = start + (finalRot - start) * ease(t); cv.style.transform = "rotate(" + rot + "rad)"; if (t < 1) requestAnimationFrame(step); else { busy = false; cv.style.willChange = "auto"; onWin && onWin(prizes[idx], idx); } })(t0);
  }
  draw(); return { spin: spin, setAt: setAt };
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
  var wv = w20Wheel(o.cv, P, function (p, idx) { got.push(idx); o.onGot && o.onGot(got.slice()); render(true); });
  function render(fresh) {
    var h = "";
    got.forEach(function (i, k) { var p = P[i]; h += "<div class='pzrow'><span class='pz'>" + p.icon + "</span><div><small>Quà của bạn</small><b>" + String(p.name).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</b></div></div>"; });
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

/* ===== Thiệp / giấy khen dùng nền hoa của anh em (assets/card-bg.webp), 1080×1620 =====
   Bố cục tránh các cụm hoa trên nền: góc trái-trên (x<300,y<310) và góc phải-dưới (x>700, y>1250),
   nên chữ nằm ở giữa/trái, bó hoa tự cắm nằm góc trái-dưới.
   o: {mode:"chi"|"sep", greet, name, sub, role, wish, bd, prizes:[{icon,name}], from, bq:[...]} */
/* Ngắt dòng cân đối: giữ nguyên số dòng nhưng thu hẹp bề rộng tới mức nhỏ nhất vẫn đủ chỗ, để không có dòng cụt chỉ 1 từ */
function w20WrapBal(g, txt, maxW) {
  var base = w20Wrap(g, txt, maxW), n = base.length; if (n < 2) return base;
  var lo = maxW * .45, hi = maxW, mid, best = base, t;
  for (var k = 0; k < 14; k++) { mid = (lo + hi) / 2; t = w20Wrap(g, txt, mid); if (t.length <= n) { best = t; hi = mid; } else lo = mid; }
  return best;
}
function w20DrawCard(g, o) {
  var W = 1080, H = 1620, i, PF = "'Playfair Display',Georgia,serif", DS = "'Dancing Script','Brush Script MT',cursive", BV = "'Be Vietnam Pro','Segoe UI',Arial,sans-serif";
  var ROSE = "#a8324f", ROSE2 = "#c8506f", BROWN = "#5b3340", SOFT = "#8a5a4e";
  g.save(); g.textBaseline = "alphabetic"; g.textAlign = "center";
  var bg = w20Img("assets/card-bg.webp");
  if (bg.complete && bg.naturalWidth) g.drawImage(bg, 0, 0, W, H); else { g.fillStyle = "#fff8f5"; g.fillRect(0, 0, W, H); }
  function ls(px) { if ("letterSpacing" in g) g.letterSpacing = px + "px"; }
  /* ---- đầu thiệp (lệch phải để tránh hoa góc trái-trên) ---- */
  var hx = 650;
  g.fillStyle = SOFT; g.font = "600 25px " + BV; ls(5); g.fillText("PHÒNG PTSPBL  ·  20.10." + new Date().getFullYear(), hx, 128); ls(0);
  var hs = 116, hw = 700; g.font = "700 " + hs + "px " + DS; while (g.measureText("Happy Women's Day").width > hw && hs > 70) { hs -= 4; g.font = "700 " + hs + "px " + DS; }
  g.fillStyle = ROSE2; g.shadowColor = "rgba(200,80,111,.25)"; g.shadowBlur = 10; g.shadowOffsetY = 3; g.fillText("Happy Women's Day", hx, 262); g.shadowColor = "transparent"; g.shadowBlur = 0; g.shadowOffsetY = 0;
  var gr = g.createLinearGradient(0, 290, 0, 470); gr.addColorStop(0, "#d9728b"); gr.addColorStop(1, "#9c2d4b");
  g.shadowColor = "rgba(168,50,79,.25)"; g.shadowBlur = 22; g.shadowOffsetY = 8; g.fillStyle = gr; g.font = "700 200px " + PF; g.fillText("20.10", 600, 456); g.shadowColor = "transparent"; g.shadowBlur = 0; g.shadowOffsetY = 0;
  g.fillStyle = SOFT; g.font = "600 28px " + BV; g.fillText(o.greet || "Gửi chị em thương mến", 560, 522); var y = 522;
  /* ---- tên ---- */
  var nm = o.name || "Chị em Phòng PTSPBL", fs = 90; g.fillStyle = ROSE; g.font = "italic 700 " + fs + "px " + PF;
  while (g.measureText(nm).width > 800 && fs > 44) { fs -= 3; g.font = "italic 700 " + fs + "px " + PF; }
  y += fs * .95 + 8; g.fillText(nm, 560, y);
  if (o.sub) { y += 44; var ss = 28; g.fillStyle = SOFT; g.font = "500 " + ss + "px " + BV; while (g.measureText(o.sub).width > 800 && ss > 18) { ss--; g.font = "500 " + ss + "px " + BV; } g.fillText(o.sub, 560, y); }
  /* ---- danh hiệu vui ---- */
  var rl = o.role || "", rs = 28; g.font = "700 " + rs + "px " + BV;
  if (rl) {
    var rw = Math.min(g.measureText(rl).width + 70, 800); while (g.measureText(rl).width > rw - 50 && rs > 18) { rs--; g.font = "700 " + rs + "px " + BV; } rw = Math.min(g.measureText(rl).width + 70, 800);
    y += 26; var pg = g.createLinearGradient(560 - rw / 2, 0, 560 + rw / 2, 0); pg.addColorStop(0, "#e59aa8"); pg.addColorStop(1, "#cf6580");
    g.shadowColor = "rgba(168,50,79,.25)"; g.shadowBlur = 12; g.shadowOffsetY = 4; g.fillStyle = pg; w20Rr(g, 560 - rw / 2, y, rw, 58, 29); g.fill(); g.shadowColor = "transparent"; g.shadowBlur = 0; g.shadowOffsetY = 0;
    g.fillStyle = "#fff"; g.fillText(rl, 560, y + 39); y += 58;
  }
  if (o.bd) { y += 40; g.fillStyle = ROSE2; g.font = "italic 600 26px " + BV; g.fillText("🎂 Và chúc mừng sinh nhật tháng 10 nữa nha!", 560, y); }
  /* ---- lời chúc ---- */
  y += 70; var wsz = 38, WX = 470, WW = 630; g.font = "italic 500 " + wsz + "px " + PF; var txt = o.wish || "", wl = w20WrapBal(g, txt, WW);
  while (wl.length > 5 && wsz > 28) { wsz -= 2; g.font = "italic 500 " + wsz + "px " + PF; wl = w20WrapBal(g, txt, WW); }
  var lh = wsz * 1.45, ny = Math.min(wl.length, 8), mw = 0;
  g.font = "italic 500 " + wsz + "px " + PF; for (i = 0; i < ny; i++) mw = Math.max(mw, g.measureText(wl[i]).width);
  var lw = ny ? g.measureText(wl[ny - 1]).width : 0;
  g.fillStyle = "rgba(200,80,111,.55)"; g.font = "700 110px " + PF; g.textAlign = "right"; g.fillText("“", WX - mw / 2 - 6, y + 22); g.textAlign = "center";
  g.fillStyle = BROWN; g.font = "italic 500 " + wsz + "px " + PF;
  for (i = 0; i < ny; i++) g.fillText(wl[i], WX, y + i * lh);
  var wend = y + (ny - 1) * lh; g.fillStyle = "rgba(200,80,111,.55)"; g.font = "700 110px " + PF; g.textAlign = "left"; g.fillText("”", Math.min(WX + WW / 2 + 8, WX + lw / 2 + 6), wend + 52); g.textAlign = "center";
  /* ---- ký tên ---- */
  y = wend + 84; var sg = "Thương mến, " + (o.from || ""), sgs = 46; g.fillStyle = ROSE; g.font = "700 " + sgs + "px " + DS; while (g.measureText(sg).width > WW && sgs > 28) { sgs -= 2; g.font = "700 " + sgs + "px " + DS; } g.fillText(sg, WX, y);
  /* ---- quà đã nhận ---- */
  var pz = (o.prizes || []).slice(0, 2);
  if (pz.length) {
    y += 34; var px = 130, py2 = y, ph = 50; g.textAlign = "left";
    pz.forEach(function (p) {
      var t = p.icon + "  " + p.name, ps = 24; g.font = "600 " + ps + "px " + BV; while (g.measureText(t).width > 560 && ps > 16) { ps--; g.font = "600 " + ps + "px " + BV; }
      var tw = g.measureText(t).width + 40; if (px + tw > 780 && px > 130) { px = 130; py2 += ph + 10; }
      g.fillStyle = "rgba(255,255,255,.78)"; g.strokeStyle = "rgba(200,80,111,.45)"; g.lineWidth = 1.5; w20Rr(g, px, py2, tw, ph, 25); g.fill(); g.stroke();
      g.fillStyle = BROWN; g.fillText(t, px + 20, py2 + 33); px += tw + 12;
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

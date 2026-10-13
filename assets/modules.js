/* Các mô-đun dùng chung: cắm hoa, vòng quay quà, tường lời chúc */
var W20FL = ["🌹", "🌷", "🌸", "🌺", "🌻", "💐", "🌼", "🪻"];
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
    var sl = W20SLOT[idx[i]], sz = S * .6 * sl[2], spr = w20Spr(W20FL[list[idx[i]]], 128);
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
/* Giao diện cắm hoa. opt: { min: số bông tối thiểu, onChange(list), onDone(list) } */
function w20BouquetUI(box, opt) {
  opt = typeof opt === "function" ? { onChange: opt } : (opt || {}); var list = (opt.start || []).slice(), MAX = W20SLOT.length, min = opt.min || 1;
  box.innerHTML = '<div class="bqpal"></div><div class="bqstage"><canvas class="bqcv" width="560" height="620"></canvas></div><div class="bqinfo"></div>'
    + '<div class="acts"><button type="button" class="btn ghost bqundo" style="font-size:15px;padding:10px 18px">↩️ Bỏ bông vừa cắm</button><button type="button" class="btn pink bqgive" style="font-size:16px;padding:12px 22px">💐 Xong bó hoa</button></div>';
  var pal = box.querySelector(".bqpal"), cv = box.querySelector(".bqcv"), g = cv.getContext("2d"), info = box.querySelector(".bqinfo"), raf = 0;
  pal.innerHTML = W20FL.map(function (f, i) { return '<button type="button" class="fl" data-i="' + i + '" aria-label="Thêm hoa">' + f + "</button>"; }).join("");
  function draw() { g.clearRect(0, 0, 560, 620); w20DrawBouquet(g, 280, 300, 230, list); }
  function upd() {
    cancelAnimationFrame(raf); raf = requestAnimationFrame(draw);
    info.textContent = !list.length ? "Chạm vào hoa để cắm nha (tối đa " + MAX + " bông)" : list.length < min ? "Đã cắm " + list.length + " bông, thêm " + (min - list.length) + " bông nữa là đẹp" : "Đã cắm " + list.length + "/" + MAX + " bông. Đẹp rồi đó!";
    opt.onChange && opt.onChange(list.slice());
  }
  pal.addEventListener("click", function (e) { var b = e.target.closest(".fl"); if (!b) return; if (list.length >= MAX) list.shift(); list.push(+b.getAttribute("data-i")); upd(); });
  box.querySelector(".bqundo").onclick = function () { list.pop(); upd(); };
  var give = box.querySelector(".bqgive");
  give.onclick = function (e) { if (list.length < min) { info.textContent = "Cắm ít nhất " + min + " bông rồi bấm Xong nha 🌷"; info.classList.remove("shake"); void info.offsetWidth; info.classList.add("shake"); return; } opt.onDone && opt.onDone(list.slice(), e); };
  upd();
  return { list: function () { return list.slice(); }, give: give, canvas: cv };
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

/* Các mô-đun dùng chung: cắm hoa, vòng quay quà, tường lời chúc */
var W20FL = ["🌹", "🌷", "🌸", "🌺", "🌻", "💐", "🌼", "🪻"];
var W20SLOT = [[0, -.15], [-.42, 0], [.42, 0], [-.2, -.5], [.2, -.5], [-.68, .22], [.68, .22], [0, -.82], [0, .2]];

/* Vẽ bó hoa: ctx, tâm x, y, kích thước (nửa chiều rộng), danh sách số thứ tự hoa */
function w20DrawBouquet(g, cx, cy, S, list) {
  var i, p, n = list.length;
  g.save();
  g.strokeStyle = "#2f9d5b"; g.lineWidth = Math.max(3, S * .035); g.lineCap = "round";
  for (i = 0; i < n; i++) { p = W20SLOT[i]; g.beginPath(); g.moveTo(cx, cy + S * .95); g.lineTo(cx + p[0] * S, cy + p[1] * S + S * .15); g.stroke(); }
  g.fillStyle = "#ff8fb8"; g.beginPath(); g.moveTo(cx - S * .55, cy + S * .2); g.lineTo(cx + S * .55, cy + S * .2); g.lineTo(cx + S * .12, cy + S * 1.05); g.lineTo(cx - S * .12, cy + S * 1.05); g.closePath(); g.fill();
  g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.moveTo(cx - S * .55, cy + S * .2); g.lineTo(cx, cy + S * .5); g.lineTo(cx + S * .55, cy + S * .2); g.closePath(); g.fill();
  g.fillStyle = "#ffd76a"; g.fillRect(cx - S * .1, cy + S * .62, S * .2, S * .09);
  g.textAlign = "center"; g.textBaseline = "middle"; g.font = Math.round(S * .46) + "px serif";
  for (i = 0; i < n; i++) { p = W20SLOT[i]; g.save(); g.translate(cx + p[0] * S, cy + p[1] * S); g.rotate(p[0] * .5); g.fillText(W20FL[list[i]], 0, 0); g.restore(); }
  g.restore();
}
/* Giao diện cắm hoa: box = phần tử chứa. cb(list) gọi mỗi khi đổi */
function w20BouquetUI(box, cb) {
  var list = [];
  box.innerHTML = '<div class="bqpal"></div><canvas class="bqcv" width="520" height="480"></canvas><div class="bqinfo"></div><div class="acts"><button type="button" class="btn ghost bqundo" style="font-size:15px;padding:10px 18px">↩️ Bỏ bông cuối</button><button type="button" class="btn pink bqgive" style="font-size:16px;padding:12px 22px">🎁 Tặng bó hoa</button></div>';
  var pal = box.querySelector(".bqpal"), cv = box.querySelector(".bqcv"), g = cv.getContext("2d"), info = box.querySelector(".bqinfo");
  pal.innerHTML = W20FL.map(function (f, i) { return '<button type="button" class="fl" data-i="' + i + '" aria-label="Thêm hoa">' + f + "</button>"; }).join("");
  function draw() { g.clearRect(0, 0, 520, 480); w20DrawBouquet(g, 260, 160, 210, list); info.textContent = list.length ? "Đã cắm " + list.length + "/9 bông" : "Chạm vào hoa để cắm (tối đa 9 bông)"; cb && cb(list.slice()); }
  pal.addEventListener("click", function (e) { var b = e.target.closest(".fl"); if (!b) return; if (list.length < 9) list.push(+b.getAttribute("data-i")); else { list.shift(); list.push(+b.getAttribute("data-i")); } draw(); });
  box.querySelector(".bqundo").onclick = function () { list.pop(); draw(); };
  draw();
  return { list: function () { return list.slice(); }, give: box.querySelector(".bqgive") };
}

/* Vòng quay quà: vẽ một lần, quay bằng CSS (GPU) nên không giật */
function w20Wheel(cv, prizes, onWin) {
  var g = cv.getContext("2d"), n = prizes.length, seg = 6.283185 / n, rot = 0, busy = false, COL = ["#ff4f9a", "#ffd76a", "#12a05f", "#a78bfa", "#ff9f43", "#4fc3f7", "#ef5350", "#9ccc65"];
  function draw() {
    var W = cv.width, R = W / 2 - 8, i;
    g.clearRect(0, 0, W, W); g.save(); g.translate(W / 2, W / 2);
    for (i = 0; i < n; i++) {
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R, -1.5708 + i * seg, -1.5708 + (i + 1) * seg); g.closePath(); g.fillStyle = COL[i % COL.length]; g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 4; g.stroke();
      g.save(); g.rotate((i + .5) * seg); g.textAlign = "center"; g.font = Math.round(R * .26) + "px serif"; g.fillText(prizes[i][0], 0, -R * .66); g.restore();
    }
    g.restore();
  }
  function ease(t) { return 1 - Math.pow(1 - t, 3.2); }
  function spin() {
    if (busy) return; busy = true; var idx = (Math.random() * n) | 0, start = rot, a = (idx + .5) * seg;
    var finalRot = Math.ceil((start + 6.283 * 5) / 6.283) * 6.283 - a, t0 = performance.now(), D = 4300;
    cv.style.willChange = "transform";
    (function step(now) { var t = Math.min(1, (now - t0) / D); rot = start + (finalRot - start) * ease(t); cv.style.transform = "rotate(" + rot + "rad)"; if (t < 1) requestAnimationFrame(step); else { busy = false; cv.style.willChange = "auto"; onWin && onWin(prizes[idx], idx); } })(t0);
  }
  draw(); return { spin: spin };
}

/* Tường lời chúc */
function w20Wall(el, msgs) {
  var C = ["#fff3a8", "#ffd6e6", "#d3f5e1", "#d6e8ff", "#ffe2c2"];
  el.innerHTML = (msgs || []).map(function (m, i) { return '<div class="note2" style="background:' + C[i % C.length] + ";transform:rotate(" + (((i * 37) % 7) - 3) + 'deg)"><p></p><b></b></div>'; }).join("");
  var ns = el.querySelectorAll(".note2");
  (msgs || []).forEach(function (m, i) { ns[i].querySelector("p").textContent = "“" + m.text + "”"; ns[i].querySelector("b").textContent = "— " + m.from; });
}

/* Hoa vẽ bằng canvas (không dùng emoji): 8 loại, vẽ sẵn thành hình một lần để dùng lại.
   w20FlowerSprite(i) → canvas 256×256 (đầu hoa nằm giữa, bán kính ~120). */
var W20FN = ["Hồng", "Mẫu đơn", "Tulip", "Hướng dương", "Cúc trắng", "Đồng tiền", "Huệ", "Cẩm tú cầu"];
var W20FLS = {};
function w20Pet(g, len, wid, c0, c1, edge) {
  var gr = g.createLinearGradient(0, 0, 0, -len); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(wid, -len * .28, wid * .95, -len * .88, 0, -len); g.bezierCurveTo(-wid * .95, -len * .88, -wid, -len * .28, 0, 0); g.closePath();
  g.fillStyle = gr; g.fill(); if (edge) { g.strokeStyle = edge; g.lineWidth = 1.4; g.stroke(); }
}
function w20Ring(g, n, off, len, wid, c0, c1, edge, r0) {
  for (var k = 0; k < n; k++) { g.save(); g.rotate(off + k * 6.283185 / n); g.translate(0, -(r0 || 0)); w20Pet(g, len, wid, c0, c1, edge); g.restore(); }
}
function w20Sheen(g, R, a) { var s = g.createRadialGradient(-R * .3, -R * .35, 2, -R * .1, -R * .1, R); s.addColorStop(0, "rgba(255,255,255," + (a || .3) + ")"); s.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = s; g.beginPath(); g.arc(0, 0, R, 0, 6.283); g.fill(); }
var W20PAINT = [
  /* 0 Hồng */ function (g, R) {
    w20Ring(g, 7, .2, R * .88, R * .5, "#f9b2c3", "#de4468", "rgba(150,20,50,.35)", 0);
    w20Ring(g, 6, .9, R * .7, R * .42, "#f59ab2", "#cf305a", "rgba(130,15,45,.35)", 0);
    w20Ring(g, 5, .4, R * .53, R * .34, "#ef7f9d", "#bd2550", "rgba(120,10,40,.35)", 0);
    w20Ring(g, 4, 1.1, R * .38, R * .26, "#e6648a", "#a81d46", "rgba(110,10,35,.4)", 0);
    g.strokeStyle = "rgba(100,8,32,.55)"; g.lineWidth = 3; g.lineCap = "round";
    for (var i = 0; i < 4; i++) { g.beginPath(); g.arc(0, 0, R * (.07 + i * .05), i * 1.7, i * 1.7 + 3.6); g.stroke(); }
    g.fillStyle = "#8c1a3d"; g.beginPath(); g.arc(0, 0, R * .05, 0, 6.283); g.fill(); w20Sheen(g, R * .9, .28);
  },
  /* 1 Mẫu đơn */ function (g, R) {
    w20Ring(g, 11, 0, R * .92, R * .5, "#fde7ee", "#f4a3bb", "rgba(200,90,120,.3)", 0);
    w20Ring(g, 9, .3, R * .74, R * .46, "#fbd3df", "#ee86a6", "rgba(190,70,105,.3)", 0);
    w20Ring(g, 7, .7, R * .56, R * .4, "#f9bfd0", "#e36a91", "rgba(180,55,95,.3)", 0);
    w20Ring(g, 5, 1.2, R * .38, R * .3, "#f7a9c1", "#d9507e", "rgba(170,40,85,.35)", 0);
    g.fillStyle = "#ffd45a"; for (var i = 0; i < 14; i++) { var a = i * 2.4, r = R * .06 + (i % 5) * R * .015; g.beginPath(); g.arc(Math.cos(a) * r * 1.6, Math.sin(a) * r * 1.6, R * .028, 0, 6.283); g.fill(); } w20Sheen(g, R * .9, .3);
  },
  /* 2 Tulip */ function (g, R) {
    g.save(); g.translate(0, R * .05);
    var back = g.createLinearGradient(0, -R, 0, R); back.addColorStop(0, "#ffb3cc"); back.addColorStop(1, "#d93a72");
    g.fillStyle = back; g.strokeStyle = "rgba(140,20,60,.4)"; g.lineWidth = 2;
    [[-1, 0], [1, 0]].forEach(function (m) { var s = m[0]; g.beginPath(); g.moveTo(s * .12 * R, .9 * R); g.bezierCurveTo(s * .8 * R, .62 * R, s * .78 * R, -.5 * R, s * .5 * R, -.95 * R); g.bezierCurveTo(s * .3 * R, -.62 * R, s * .12 * R, -.55 * R, 0, -.5 * R); g.lineTo(0, .85 * R); g.closePath(); g.fill(); g.stroke(); });
    var fr = g.createLinearGradient(-R * .4, -R, R * .4, R); fr.addColorStop(0, "#ffe0ec"); fr.addColorStop(.5, "#ff8fb4"); fr.addColorStop(1, "#e0457c");
    g.fillStyle = fr; g.beginPath(); g.moveTo(0, .92 * R); g.bezierCurveTo(-.52 * R, .72 * R, -.5 * R, -.2 * R, -.22 * R, -1 * R); g.bezierCurveTo(-.08 * R, -.7 * R, .08 * R, -.7 * R, .22 * R, -1 * R); g.bezierCurveTo(.5 * R, -.2 * R, .52 * R, .72 * R, 0, .92 * R); g.fill(); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.4)"; g.lineWidth = 4; g.beginPath(); g.moveTo(-.18 * R, .5 * R); g.quadraticCurveTo(-.3 * R, 0, -.14 * R, -.6 * R); g.stroke(); g.restore();
  },
  /* 3 Hướng dương */ function (g, R) {
    w20Ring(g, 20, 0, R, R * .16, "#f5a30a", "#ffd83d", "rgba(160,90,0,.35)", 0);
    w20Ring(g, 20, .157, R * .86, R * .15, "#f08a00", "#ffcb2b", "rgba(150,80,0,.3)", 0);
    var c = g.createRadialGradient(0, 0, 2, 0, 0, R * .46); c.addColorStop(0, "#6b4420"); c.addColorStop(.7, "#3b2410"); c.addColorStop(1, "#24140a"); g.fillStyle = c; g.beginPath(); g.arc(0, 0, R * .46, 0, 6.283); g.fill();
    g.fillStyle = "rgba(190,140,70,.55)"; for (var i = 1; i < 90; i++) { var a = i * 2.39996, r = Math.sqrt(i) * R * .045; if (r < R * .43) { g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, R * .016, 0, 6.283); g.fill(); } }
  },
  /* 4 Cúc trắng */ function (g, R) {
    w20Ring(g, 18, 0, R, R * .13, "#e5e9ef", "#ffffff", "rgba(150,160,175,.55)", 0);
    w20Ring(g, 18, .17, R * .84, R * .12, "#eef1f5", "#ffffff", "rgba(150,160,175,.45)", 0);
    var c = g.createRadialGradient(0, 0, 1, 0, 0, R * .26); c.addColorStop(0, "#ffe066"); c.addColorStop(.8, "#ffc233"); c.addColorStop(1, "#e89a12"); g.fillStyle = c; g.beginPath(); g.arc(0, 0, R * .26, 0, 6.283); g.fill();
    g.fillStyle = "rgba(180,100,0,.35)"; for (var i = 0; i < 18; i++) { var a = i * 2.4; g.beginPath(); g.arc(Math.cos(a) * R * .12 * (1 + i % 3 * .4), Math.sin(a) * R * .12 * (1 + i % 3 * .4), R * .02, 0, 6.283); g.fill(); }
  },
  /* 5 Đồng tiền */ function (g, R) {
    w20Ring(g, 26, 0, R, R * .12, "#ff5a3c", "#ffb08a", "rgba(150,30,10,.3)", 0);
    w20Ring(g, 20, .1, R * .8, R * .12, "#ff3f6c", "#ff9aa8", "rgba(150,20,50,.3)", 0);
    w20Ring(g, 14, .2, R * .6, R * .11, "#ff6f91", "#ffc1cf", "rgba(150,20,50,.25)", 0);
    g.fillStyle = "#3a2a22"; g.beginPath(); g.arc(0, 0, R * .22, 0, 6.283); g.fill();
    g.fillStyle = "#ffcf40"; for (var i = 0; i < 16; i++) { var a = i * 6.283 / 16; g.beginPath(); g.arc(Math.cos(a) * R * .16, Math.sin(a) * R * .16, R * .035, 0, 6.283); g.fill(); }
  },
  /* 6 Huệ */ function (g, R) {
    w20Ring(g, 3, .52, R * .95, R * .34, "#fff2f6", "#f6a5c0", "rgba(190,80,120,.35)", 0);
    w20Ring(g, 3, 0, R, R * .36, "#ffffff", "#f48fb1", "rgba(190,80,120,.4)", 0);
    g.fillStyle = "rgba(190,40,90,.5)"; for (var i = 0; i < 30; i++) { var a = (i % 6) * 1.047 + (i % 3) * .08, r = R * (.2 + (i * 7 % 10) * .05); g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, R * .018, 0, 6.283); g.fill(); }
    g.strokeStyle = "#e7c46a"; g.lineWidth = 2.5; for (i = 0; i < 6; i++) { var b = i * 1.047 + .3; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(b) * R * .34, Math.sin(b) * R * .34); g.stroke(); g.fillStyle = "#c9742a"; g.beginPath(); g.ellipse(Math.cos(b) * R * .37, Math.sin(b) * R * .37, R * .045, R * .03, b, 0, 6.283); g.fill(); }
    g.fillStyle = "#fff6c8"; g.beginPath(); g.arc(0, 0, R * .07, 0, 6.283); g.fill();
  },
  /* 7 Cẩm tú cầu */ function (g, R) {
    var cols = [["#7f8cff", "#b7bfff"], ["#a07bff", "#d2bfff"], ["#6aa5ff", "#b8d6ff"], ["#c08bff", "#ebd2ff"]], n = 44;
    for (var i = 0; i < n; i++) {
      var a = i * 2.39996, r = Math.sqrt(i / n) * R * .78, x = Math.cos(a) * r, y = Math.sin(a) * r, cc = cols[(i * 7) % 4];
      g.save(); g.translate(x, y); g.rotate(a);
      for (var k = 0; k < 4; k++) { g.save(); g.rotate(k * 1.5708); w20Pet(g, R * .26, R * .17, cc[0], cc[1], "rgba(70,60,160,.3)"); g.restore(); }
      g.fillStyle = "#fff6c8"; g.beginPath(); g.arc(0, 0, R * .035, 0, 6.283); g.fill(); g.restore();
    }
  }
];
function w20FlowerSprite(i) {
  i = ((i % W20PAINT.length) + W20PAINT.length) % W20PAINT.length;
  if (W20FLS[i]) return W20FLS[i];
  var c = document.createElement("canvas"); c.width = c.height = 256; var g = c.getContext("2d");
  g.translate(128, 128); g.shadowColor = "rgba(60,0,25,.28)"; g.shadowBlur = 8; g.shadowOffsetY = 3; W20PAINT[i](g, 112);
  return (W20FLS[i] = c);
}

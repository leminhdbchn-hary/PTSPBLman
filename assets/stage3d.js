/* Sân khấu trao quà 3D (Three.js r128, file assets/three.min.js).
   Cùng cách dùng với W20Stage (2D): W20Stage3D.make(canvas, opts) → { queue(evt), size(), stop() }.
   Thân nhân vật và sân khấu là 3D; mặt là ảnh cắt (assets/men, assets/women) dán lên đầu, luôn quay về phía người xem.
   Trình duyệt không chạy được WebGL thì W20Stage3D.ok() trả về false để trang dùng bản 2D. */
var W20Stage3D = (function () {
  var T = window.THREE;
  function ok() {
    if (!T) return false;
    try { var c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch (e) { return false; }
  }
  var TITLES = [
    ["Người xinh đẹp nhất", ["#ff9ac4", "#d6336c"]], ["Người đáng yêu nhất", ["#ffb38a", "#e8590c"]], ["Người cười tươi nhất", ["#ffd666", "#e0a100"]],
    ["Người hiền nhất phòng", ["#9be7c4", "#12a05f"]], ["Người giỏi giang nhất", ["#9ec5ff", "#2b6fd6"]], ["Người đẹp không cần filter", ["#d9a8ff", "#8a3fd0"]],
    ["Người ít than việc nhất", ["#8fe3e8", "#0f9aa6"]], ["Người đi ăn trưa đúng giờ nhất", ["#ffc2a8", "#d9480f"]], ["Người có giọng nói ngọt nhất", ["#ffa8d8", "#c2255c"]], ["Người luôn làm việc “rất nhanh”", ["#c8e07a", "#6a9a1a"]]
  ];
  var STYLES = ["Đưa hai tay", "Quỳ gối trao", "Cúi chào trao quà", "Trao quà rồi vẫy tay chào", "Bước tới trao quà rồi bắt tay"];
  function hash(x) { var h = 0; x = String(x); for (var i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) >>> 0; return h; }
  function shortName(n) { var w = String(n || "").trim().split(/\s+/); return w.length > 3 ? w[0] + " " + w.slice(-2).join(" ") : w.join(" "); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function ease(k) { k = Math.max(0, Math.min(1, k)); return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function clamp01(k) { return Math.max(0, Math.min(1, k)); }

  function make(cv, opt) {
    opt = opt || {};
    var wrap = cv.parentNode, W0 = 960, H0 = 540;
    var RM = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); /* giảm chuyển động */
    var R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: "high-performance" });
    R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    R.outputEncoding = T.sRGBEncoding; R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
    var S = new T.Scene(); S.background = new T.Color("#05231d"); S.fog = new T.Fog("#05231d", 18, 34);
    var CAM = new T.PerspectiveCamera(38, W0 / H0, .1, 100);
    var TEX = {}, PH = null;
    /* ảnh thay thế khi thiếu/lỗi ảnh mặt: bóng người trên nền champagne, không làm vỡ bố cục */
    function placeholder() {
      if (PH) return PH; var c = document.createElement("canvas"); c.width = 216; c.height = 264; var g = c.getContext("2d");
      g.fillStyle = "#fff"; g.beginPath(); g.ellipse(108, 132, 104, 128, 0, 0, 6.283); g.fill();
      var gr = g.createLinearGradient(0, 0, 0, 264); gr.addColorStop(0, "#f7ecd0"); gr.addColorStop(1, "#d9c28a"); g.fillStyle = gr; g.beginPath(); g.ellipse(108, 132, 94, 118, 0, 0, 6.283); g.fill();
      g.fillStyle = "#0e6b57"; g.beginPath(); g.arc(108, 108, 40, 0, 6.283); g.fill(); g.beginPath(); g.ellipse(108, 228, 66, 62, 0, Math.PI, 0); g.fill();
      PH = c; return c;
    }
    function tex(src, fb) {
      var k = src + "|" + (fb || ""); if (TEX[k]) return TEX[k];
      var t = new T.Texture(placeholder()); t.encoding = T.sRGBEncoding; t.needsUpdate = true; TEX[k] = t;
      function load(u, fail) { var im = new Image(); im.onload = function () { t.image = im; t.needsUpdate = true; }; im.onerror = fail || function () {}; im.src = /^assets\//.test(u) ? u + "?v=3d2" : u; }
      if (!src) return t;
      load(src, function () { if (fb) load(fb); });
      return t;
    }
    function pastel(h, a) { return "#" + new T.Color(h).lerp(new T.Color("#ffffff"), a).getHexString(); }
    function lc(c) { return new T.Color(c).convertSRGBToLinear(); }
    function mat(c, o) { o = o || {}; o.color = lc(c); if (o.emissive) o.emissive = lc(o.emissive); return new T.MeshStandardMaterial(o); }
    function cvTex(w, h, fn) { var c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }

    /* ---------- ánh sáng ---------- */
    S.add(new T.AmbientLight("#fff0d6", .38));
    S.add(new T.HemisphereLight("#fff4dc", "#0a3a30", .45));
    var key = new T.DirectionalLight("#fff4e0", 1.0); key.position.set(3, 9, 8); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); var sc0 = key.shadow.camera; sc0.left = -10; sc0.right = 10; sc0.top = 8; sc0.bottom = -3; sc0.near = 1; sc0.far = 30; key.shadow.bias = -.0008; S.add(key);
    var spots = [];
    [["#ffe6a8", -5], ["#fff4d0", 0], ["#c9f0e6", 5]].forEach(function (s, i) {
      var sp = new T.SpotLight(s[0], .9, 26, .3, .6, 1.2); sp.position.set(s[1] * .8, 9.5, 5); sp.target.position.set(s[1] * .4, 0, 0); S.add(sp); S.add(sp.target);
      var beam = new T.Mesh(new T.ConeGeometry(1.6, 9.5, 24, 1, true), new T.MeshBasicMaterial({ color: s[0], transparent: true, opacity: .045, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
      beam.position.set(s[1] * .6, 4.9, 2.5); S.add(beam); spots.push({ l: sp, b: beam, x: s[1], i: i });
    });

    /* ---------- sân khấu ---------- */
    var floorTex = cvTex(512, 256, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#d79a5a"); gr.addColorStop(1, "#8a5428"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = "rgba(70,35,10,.35)"; g.lineWidth = 3; for (var y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (var x = (y / 32 % 2) * 64; x < w; x += 128) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke(); } }
    });
    var floor = new T.Mesh(new T.BoxGeometry(22, .4, 9), mat("#ffffff", { map: floorTex, roughness: .45, metalness: .05 })); floor.position.set(0, -.2, -1); floor.receiveShadow = true; S.add(floor);
    var edge = new T.Mesh(new T.BoxGeometry(22, .08, .12), mat("#f3c969", { metalness: .7, roughness: .3, emissive: "#5a3a00" })); edge.position.set(0, .02, 3.5); S.add(edge);
    var carpet = new T.Mesh(new T.PlaneGeometry(5.2, 9), mat("#0c5c49", { roughness: .9 })); carpet.rotation.x = -Math.PI / 2; carpet.position.set(0, .012, -1); carpet.receiveShadow = true; S.add(carpet);
    [-2.6, 2.6].forEach(function (x) { var l = new T.Mesh(new T.PlaneGeometry(.08, 9), mat("#f3c969", { emissive: "#6a4a00" })); l.rotation.x = -Math.PI / 2; l.position.set(x, .015, -1); S.add(l); });
    /* phông sau */
    var back = cvTex(1024, 512, function (g, w, h) {
      var gr = g.createRadialGradient(w / 2, h * .45, 30, w / 2, h * .45, w * .55); gr.addColorStop(0, "#26b39a"); gr.addColorStop(.55, "#0d6556"); gr.addColorStop(1, "#04221c"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (var i = 0; i < 160; i++) { g.fillStyle = "rgba(255,236,190," + (.25 + Math.random() * .7) + ")"; g.beginPath(); g.arc(Math.random() * w, Math.random() * h * .85, .6 + Math.random() * 1.8, 0, 6.283); g.fill(); }
    });
    var wall = new T.Mesh(new T.PlaneGeometry(26, 12), new T.MeshBasicMaterial({ map: back })); wall.position.set(0, 5, -5.4); S.add(wall);
    /* băng rôn */
    var banTex = cvTex(1024, 128, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ffefb0"); gr.addColorStop(1, "#e0a100"); g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, 6); g.lineTo(w, 6); g.lineTo(w - 40, h / 2); g.lineTo(w, h - 6); g.lineTo(0, h - 6); g.lineTo(40, h / 2); g.closePath(); g.fill();
      g.fillStyle = "#0a4a3b"; g.font = "700 62px 'Playfair Display',Georgia,serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("✦ PTSPBL AWARDS | 20.10 ✦", w / 2, h / 2 + 3);
    });
    var banner = new T.Mesh(new T.PlaneGeometry(8.4, 1.05), new T.MeshBasicMaterial({ map: banTex, transparent: true })); banner.position.set(0, 6.55, -3.2); S.add(banner);
    /* rèm hai bên */
    var curMat = mat("#0d5c48", { roughness: .7, metalness: .05 });
    [-1, 1].forEach(function (sd) {
      for (var i = 0; i < 9; i++) { var cy = new T.Mesh(new T.CylinderGeometry(.34, .4, 10.5, 12), curMat); cy.position.set(sd * (8.4 - i * .42), 5.1, -1.6 + Math.sin(i) * .25); cy.castShadow = true; S.add(cy); }
      
    });
    var val = new T.Mesh(new T.BoxGeometry(22, 1.1, .6), curMat); val.position.set(0, 9.6, -1.5); S.add(val);
    var valGold = new T.Mesh(new T.BoxGeometry(22, .12, .65), mat("#f3c969", { metalness: .8, roughness: .3 })); valGold.position.set(0, 9.03, -1.5); S.add(valGold);
    /* bóng đèn viền */
    var bulbs = [];
    for (var b = 0; b < 26; b++) { var bm = new T.Mesh(new T.SphereGeometry(.09, 10, 8), new T.MeshBasicMaterial({ color: lc("#fff1c9") })); bm.position.set(-10.5 + b * .84, 8.85, -1.15); S.add(bm); bulbs.push(bm); }
    /* vòm hoa */
    var arch = new T.Mesh(new T.TorusGeometry(4.2, .07, 10, 80, Math.PI), mat("#f3c969", { metalness: .8, roughness: .3, emissive: "#3a2600" })); arch.position.set(0, 1.6, -3.3); S.add(arch);
    [-4.2, 4.2].forEach(function (x) { var p = new T.Mesh(new T.CylinderGeometry(.07, .07, 1.6, 10), arch.material); p.position.set(x, .8, -3.3); S.add(p); });
    var flowerCols = ["#ffc9dc", "#ffb0cc", "#fff4d6", "#ffe3ee", "#ffffff"];
    for (var f = 0; f <= 40; f++) {
      var a = Math.PI * f / 40, fl = new T.Mesh(new T.SphereGeometry(.17 + (f % 3) * .04, 12, 10), mat(flowerCols[f % 5], { roughness: .6 }));
      fl.position.set(Math.cos(a) * 4.2, 1.6 + Math.sin(a) * 4.2, -3.25 + (f % 2) * .1); S.add(fl);
      if (f % 3 === 0) { var lf = new T.Mesh(new T.SphereGeometry(.12, 8, 6), mat("#3aa66a")); lf.scale.set(1.6, .6, .6); lf.position.set(Math.cos(a) * 4.45, 1.6 + Math.sin(a) * 4.45, -3.3); S.add(lf); }
    }
    /* bóng bay */
    var balloons = [];
    [[-5.4, 3.6, "#ffb3cd"], [-4.7, 4.3, "#f3dc9c"], [-6, 4.6, "#9fe3d0"], [5.4, 3.6, "#ffb3cd"], [4.7, 4.3, "#9fe3d0"], [6, 4.6, "#f3dc9c"]].forEach(function (d, i) {
      var g0 = new T.Group(), bl = new T.Mesh(new T.SphereGeometry(.42, 24, 18), mat(d[2], { roughness: .25, metalness: .15, emissive: d[2], emissiveIntensity: .12 })); bl.scale.set(1, 1.2, 1); g0.add(bl);
      var knot = new T.Mesh(new T.ConeGeometry(.07, .12, 8), bl.material); knot.position.y = -.55; knot.rotation.x = Math.PI; g0.add(knot);
      var str = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, -.6, 0), new T.Vector3(.08, -1.4, 0), new T.Vector3(-.05, -2.4, 0)]), new T.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: .6 })); g0.add(str);
      g0.position.set(d[0], d[1], -2.6); S.add(g0); balloons.push({ g: g0, y: d[1], i: i });
    });

    /* ---------- nhân vật ---------- */
    var SKIN = "#f2c9a6", NAVY = "#243666", PANTS = "#1d2b55";
    function limb(r, len, col) { var g0 = new T.Group(), m = new T.Mesh(new T.CylinderGeometry(r, r * .92, len, 12), mat(col, { roughness: .7 })); m.position.y = -len / 2; m.castShadow = true; g0.add(m); var hnd = new T.Mesh(new T.SphereGeometry(r * 1.15, 12, 10), mat(SKIN, { roughness: .6 })); hnd.position.y = -len - r * .4; g0.add(hnd); g0.userData.hand = hnd; return g0; }
    function leg(r, len, col, shoe) { var g0 = new T.Group(), m = new T.Mesh(new T.CylinderGeometry(r, r, len, 12), mat(col, { roughness: .7 })); m.position.y = -len / 2; m.castShadow = true; g0.add(m); var sh = new T.Mesh(new T.BoxGeometry(r * 2.2, r * 1.1, r * 3.2), mat(shoe, { roughness: .4 })); sh.position.set(0, -len, r * .7); sh.castShadow = true; g0.add(sh); return g0; }
    function faceSprite(map, w) { var sp = new T.Sprite(new T.SpriteMaterial({ map: map, transparent: true, depthWrite: true, alphaTest: .05 })); sp.scale.set(w, w * 1.15, 1); sp.userData.w = w; return sp; }
    function fitFace(sp) { var im = sp.material.map && sp.material.map.image; var hH = 1.45; if (im && im.width) sp.scale.set(hH * im.width / im.height, hH, 1); /* mọi mặt cao bằng nhau */ sp.position.y = sp.userData.base + sp.scale.y / 2 - .14; sp.position.z = .05; }
    function makeMan(img) {
      var root = new T.Group(), body = new T.Group(); root.add(body);
      var L1 = leg(.12, .55, PANTS, "#15151c"), L2 = leg(.12, .55, PANTS, "#15151c"); L1.position.set(-.15, .6, 0); L2.position.set(.15, .6, 0); body.add(L1, L2);
      var torso = new T.Group(); torso.position.y = .55; body.add(torso);
      var jacket = new T.Mesh(new T.CylinderGeometry(.3, .37, .66, 20), mat(NAVY, { roughness: .6 })); jacket.position.y = .33; jacket.castShadow = true; torso.add(jacket);
      var shirt = new T.Mesh(new T.ConeGeometry(.15, .36, 3), mat("#ffffff")); shirt.rotation.x = Math.PI; shirt.position.set(0, .5, .27); shirt.scale.z = .3; torso.add(shirt);
      var tie = new T.Mesh(new T.BoxGeometry(.08, .34, .03), mat("#4a66b0", { roughness: .4 })); tie.position.set(0, .45, .33); tie.rotation.x = -.15; torso.add(tie);
      var knot = new T.Mesh(new T.BoxGeometry(.1, .07, .04), tie.material); knot.position.set(0, .63, .3); torso.add(knot);
      /* vai tròn, ve áo, cúc áo, khăn túi ngực cho com lê đẹp hơn */
      [-1, 1].forEach(function (d) { var sh = new T.Mesh(new T.SphereGeometry(.13, 16, 12), mat(NAVY, { roughness: .55 })); sh.position.set(d * .33, .6, 0); sh.castShadow = true; torso.add(sh);
        var lp = new T.Mesh(new T.BoxGeometry(.09, .3, .02), mat("#1a2850", { roughness: .4 })); lp.position.set(d * .1, .5, .3); lp.rotation.z = d * .35; torso.add(lp); });
      var top = new T.Mesh(new T.SphereGeometry(.3, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(NAVY, { roughness: .6 })); top.position.y = .66; top.scale.y = .35; torso.add(top);
      [.22, .1].forEach(function (y) { var bt = new T.Mesh(new T.SphereGeometry(.025, 10, 8), mat("#d4af37", { metalness: .8, roughness: .3 })); bt.position.set(.06, y, .36); torso.add(bt); });
      var pk = new T.Mesh(new T.BoxGeometry(.08, .05, .02), mat("#ff6f96")); pk.position.set(-.2, .5, .31); pk.rotation.y = -.3; torso.add(pk);
      var belt = new T.Mesh(new T.CylinderGeometry(.375, .375, .05, 20), mat("#141a33", { roughness: .4 })); belt.position.y = .02; torso.add(belt);
      var A1 = limb(.085, .48, NAVY), A2 = limb(.085, .48, NAVY); A1.position.set(-.38, .6, 0); A2.position.set(.38, .6, 0); torso.add(A1, A2);
      var head = faceSprite(tex(img), 1.3); head.userData.base = .66; torso.add(head);
      root.userData = { body: body, torso: torso, L: [L1, L2], A: [A1, A2], head: head }; return root;
    }
    function makeGirl(img, fb, pal) {
      var root = new T.Group(), body = new T.Group(); root.add(body);
      var L1 = leg(.07, .28, SKIN, "#7a1a3a"), L2 = leg(.07, .28, SKIN, "#7a1a3a"); L1.position.set(-.12, .3, 0); L2.position.set(.12, .3, 0); body.add(L1, L2);
      var c1 = lc(pastel(pal[0], .22)), c2 = lc(pastel(pal[1], .18));
      var dress = new T.Mesh(new T.CylinderGeometry(.2, .78, .9, 36, 1, true), new T.MeshStandardMaterial({ color: c2, roughness: .35, metalness: .25, side: T.DoubleSide, emissive: c2, emissiveIntensity: .12 })); dress.position.y = .72; dress.castShadow = true; body.add(dress);
      var hem = new T.Mesh(new T.TorusGeometry(.77, .04, 8, 40), mat("#ffffff", { roughness: .3, metalness: .4 })); hem.rotation.x = Math.PI / 2; hem.position.y = .28; body.add(hem);
      var torso = new T.Group(); torso.position.y = 1.1; body.add(torso);
      var bod = new T.Mesh(new T.CylinderGeometry(.19, .22, .36, 20), new T.MeshStandardMaterial({ color: c1, roughness: .35, metalness: .25 })); bod.position.y = .1; bod.castShadow = true; torso.add(bod);
      var sash = new T.Mesh(new T.BoxGeometry(.1, .62, .03), mat("#fff3c4", { metalness: .5, roughness: .3, emissive: "#6a5000", emissiveIntensity: .3 })); sash.position.set(0, .02, .22); sash.rotation.z = .72; torso.add(sash);
      var sp = new T.Points(new T.BufferGeometry().setFromPoints(Array.from({ length: 60 }, function (_, i) { var a = i * 2.4, yy = .32 + (i * 37 % 60) / 60 * .82, rr = lerp(.78, .2, (yy - .28) / .9) + .02; return new T.Vector3(Math.cos(a) * rr, yy, Math.sin(a) * rr); })), new T.PointsMaterial({ color: "#ffffff", size: .05, transparent: true, opacity: .9 })); body.add(sp);
      /* tay áo bồng, nơ eo */
      [-1, 1].forEach(function (d) { var pf = new T.Mesh(new T.SphereGeometry(.1, 16, 12), new T.MeshStandardMaterial({ color: c1, roughness: .35, metalness: .2 })); pf.position.set(d * .24, .25, 0); pf.scale.set(1, .85, 1); torso.add(pf); });
      var top2 = new T.Mesh(new T.SphereGeometry(.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: c1, roughness: .35, metalness: .25 })); top2.position.y = .27; top2.scale.y = .3; torso.add(top2);
      var bow = new T.Group(), bm2 = mat("#ffffff", { roughness: .35, metalness: .3 });
      [-1, 1].forEach(function (d) { var lb = new T.Mesh(new T.SphereGeometry(.07, 12, 10), bm2); lb.scale.set(1.3, .8, .5); lb.position.set(d * .08, 0, 0); bow.add(lb); });
      var bc = new T.Mesh(new T.SphereGeometry(.035, 10, 8), bm2); bow.add(bc); bow.position.set(0, -.08, .21); torso.add(bow);
      var waist = new T.Mesh(new T.TorusGeometry(.215, .025, 8, 24), bm2); waist.rotation.x = Math.PI / 2; waist.position.y = -.08; torso.add(waist);
      var A1 = limb(.065, .42, SKIN), A2 = limb(.065, .42, SKIN); A1.position.set(-.26, .26, 0); A2.position.set(.26, .26, 0); torso.add(A1, A2);
      var head = faceSprite(tex(img, fb), 1.3); head.userData.base = .28; torso.add(head);
      var crown = new T.Group(), gold = mat("#ffd24a", { metalness: .9, roughness: .2, emissive: "#6a4a00", emissiveIntensity: .4 });
      var band = new T.Mesh(new T.CylinderGeometry(.22, .22, .08, 20, 1, true), gold); crown.add(band);
      for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2, pk = new T.Mesh(new T.ConeGeometry(.05, .16 + (i === 0 ? .06 : 0), 6), gold); pk.position.set(Math.sin(a) * .22, .1, Math.cos(a) * .22); crown.add(pk); }
      var gem = new T.Mesh(new T.SphereGeometry(.04, 10, 8), mat("#ff4f86", { emissive: "#ff4f86", emissiveIntensity: .6 })); gem.position.set(0, .05, .23); crown.add(gem);
      torso.add(crown);
      root.userData = { body: body, torso: torso, L: [L1, L2], A: [A1, A2], head: head, crown: crown }; return root;
    }
    var GLOW = null;
    function glowTex() { if (GLOW) return GLOW; var c = document.createElement("canvas"); c.width = c.height = 128; var g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 4, 64, 64, 64); r.addColorStop(0, "rgba(255,246,205,1)"); r.addColorStop(.4, "rgba(255,226,150,.55)"); r.addColorStop(1, "rgba(255,226,150,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); GLOW = new T.CanvasTexture(c); return GLOW; }
    function makeGift() {
      var g0 = new T.Group(), bx = new T.Mesh(new T.BoxGeometry(.34, .3, .34), mat("#f4a6c4", { roughness: .4 })); bx.castShadow = true; g0.add(bx);
      var lidG = new T.Group(); lidG.position.set(-.19, .15, 0); g0.add(lidG);
      var lid = new T.Mesh(new T.BoxGeometry(.38, .08, .38), mat("#ffc2d9", { roughness: .4 })); lid.position.set(.19, .04, 0); lidG.add(lid);
      var gm = mat("#e9cf8e", { metalness: .6, roughness: .3, emissive: "#3a2c00", emissiveIntensity: .25 });
      var r1 = new T.Mesh(new T.BoxGeometry(.07, .3, .345), gm); g0.add(r1); var r2 = new T.Mesh(new T.BoxGeometry(.345, .3, .07), gm); g0.add(r2);
      var r3 = new T.Mesh(new T.BoxGeometry(.07, .085, .385), gm); r3.position.set(.19, .04, 0); lidG.add(r3);
      [-1, 1].forEach(function (d) { var bw = new T.Mesh(new T.TorusGeometry(.07, .025, 8, 16), mat("#f08fb0", { roughness: .4 })); bw.position.set(.19 + d * .07, .12, 0); bw.rotation.y = d * .6; lidG.add(bw); });
      var gl = new T.Sprite(new T.SpriteMaterial({ map: glowTex(), transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 0 })); gl.position.y = .2; gl.scale.set(.01, .01, 1); g0.add(gl);
      g0.userData = { lid: lidG, glow: gl };
      return g0;
    }
    function handPos(arm) { var v = new T.Vector3(); arm.userData.hand.getWorldPosition(v); return v; }
    function setWalk(c, ph, amp) { c.userData.L[0].rotation.x = Math.sin(ph) * amp; c.userData.L[1].rotation.x = -Math.sin(ph) * amp; }

    /* ---------- lớp chữ: bảng công bố, lời chúc, chữ chờ ---------- */
    var ov = document.createElement("div"); ov.className = "s3ov"; ov.setAttribute("data-s", "WAITING");
    ov.innerHTML = '<div class="s3vig"></div><div class="s3plates" aria-live="polite"></div><div class="s3wait"><b>Đang chờ chị em quay quà…</b><small>Chị em quay xong là anh em lên trao quà ngay!</small></div><div class="s3wish"></div>';
    wrap.style.position = "relative"; wrap.appendChild(ov);
    var platesEl = ov.querySelector(".s3plates"), waitEl = ov.querySelector(".s3wait"), wishEl = ov.querySelector(".s3wish");
    if (!document.getElementById("s3css")) {
      var st = document.createElement("style"); st.id = "s3css";
      st.textContent = ".s3ov{position:absolute;inset:0;pointer-events:none;font-family:'Be Vietnam Pro',sans-serif}" +
        ".s3vig{position:absolute;inset:0;opacity:0;transition:opacity .6s;background:radial-gradient(ellipse at 50% 55%,rgba(0,0,0,0) 35%,rgba(0,22,18,.62) 100%)}.s3ov[data-s=ANNOUNCING] .s3vig,.s3ov[data-s=PRESENTING] .s3vig{opacity:1}" +
        ".s3plates{position:absolute;left:4%;right:4%;top:12%;display:flex;gap:1.2%;justify-content:center}" +
        ".s3pl{flex:1 1 0;max-width:46%;background:rgba(255,248,226,.97);border:2px solid #e3c677;border-radius:14px;box-shadow:0 8px 22px rgba(0,0,0,.4);padding:.45em .45em;text-align:center;font-size:clamp(8px,1.3vw,16px);line-height:1.3;opacity:0;transform:translateY(-14px) scale(.9);transition:opacity .5s,transform .5s cubic-bezier(.2,1.4,.4,1)}" +
        ".s3pl.on{opacity:1;transform:none}.s3pl .t{font:700 1.08em 'Playfair Display',serif;color:#0b5a47}.s3pl .n{font-weight:800;color:#a02a58}" +
        ".s3pl .p,.s3pl .q{font-weight:700;color:#3b2a18;transition:opacity .5s}.s3pl .p{display:none;opacity:0}.s3pl .p img{height:1.5em!important;vertical-align:middle}.s3pl .q{color:#8a7a50;font-style:italic}" +
        ".s3pl.rev .p{display:block;opacity:1}.s3pl.rev .q{display:none}" +
        ".s3wait{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);background:rgba(4,34,28,.62);border:1px solid rgba(240,214,140,.5);border-radius:16px;padding:.8em 1.4em;text-align:center;color:#fff8e6;font-size:clamp(11px,1.8vw,20px);transition:opacity .4s}" +
        ".s3wait b{display:block;font:700 1.3em 'Playfair Display',serif}.s3wait small{color:#f3dc9c;font-weight:600}.s3ov:not([data-s=WAITING]) .s3wait{opacity:0}" +
        ".s3wish{position:absolute;left:50%;bottom:3.5%;width:max-content;max-width:88%;transform:translateX(-50%) translateY(8px);padding:.35em 1.1em;border-radius:99px;background:rgba(4,34,28,.72);border:1px solid rgba(240,214,140,.55);text-align:center;color:#fff8e6;font:700 clamp(11px,1.7vw,22px)/1.35 'Playfair Display',serif;opacity:0;transform:translateY(8px);transition:all .6s}.s3wish.on{opacity:1;transform:translateX(-50%)}" +
        ".stagewrap:fullscreen .s3pl{font-size:clamp(12px,1.6vw,26px)}";
      document.head.appendChild(st);
    }

    /* ---------- máy trạng thái: WAITING → ANNOUNCING → PRESENTING → CELEBRATING → COMPLETED ---------- */
    var MEN = (typeof W20CFG !== "undefined" && W20CFG.men) || [], Q = [], cur = null, last = null, nextMan = 0, nextStyle = 0, SEEN = {}, played = 0;
    var T1 = 2300, T2 = 3900, ANN = 1800, CEL = 4800, COMP = 2600, STATE = "WAITING", running = true, soundOn = false, stopped = false, wishT = 0;
    var WISHES = ["Chúc {n} luôn xinh đẹp, rạng rỡ như ánh đèn sân khấu!", "Chúc {n} 20/10 thật vui, thật xinh và thật… ít việc!", "Chúc {n} luôn là ngôi sao sáng nhất Phòng PTSPBL!", "Chúc {n} cười thật tươi, deadline thật nhẹ!"];
    function callName(nm) { var w = String(nm || "").trim().split(/\s+/); return w.length > 1 ? w[0] + " " + w[w.length - 1] : (w[0] || "chị em"); }
    function status() { return { state: STATE, queue: Q.length, busy: !!cur, running: running, played: played, size: Q.length + (cur ? cur.items.length : 0), canReplay: !!last, sound: soundOn }; }
    function changed() { try { opt.onChange && opt.onChange(status()); } catch (e) {} }

    /* âm thanh: chỉ phát sau khi người dùng bật bằng nút (cần thao tác của người dùng); tổng hợp bằng WebAudio, không cần tệp âm thanh */
    var AC = null;
    function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } if (AC && AC.state === "suspended") { try { AC.resume(); } catch (e) {} } return AC; }
    function tone(f, d, type, v, delay) { var a = AC; if (!a) return; var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain(); o.type = type || "sine"; o.frequency.setValueAtTime(f, t0); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v || .1, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + d); o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + .05); }
    function noise(d, v, fl, delay) { var a = AC; if (!a) return; var n = Math.floor(a.sampleRate * d), b = a.createBuffer(1, n, a.sampleRate), x = b.getChannelData(0); for (var i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / n); var s0 = a.createBufferSource(); s0.buffer = b; var f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = fl; var g = a.createGain(); g.gain.value = v; s0.connect(f); f.connect(g); g.connect(a.destination); s0.start(a.currentTime + (delay || 0)); }
    function sfx(s) {
      if (!soundOn || !AC) return;
      if (s === "ANNOUNCING") { tone(784, .5, "triangle", .09); tone(1175, .8, "triangle", .09, .18); }
      else if (s === "PRESENTING") noise(.7, .05, 900);
      else if (s === "CELEBRATING") { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, .5, "triangle", .11, i * .11); }); noise(1.8, .07, 2600, .25); }
    }
    function setState(s) {
      if (STATE === s) return; STATE = s; ov.setAttribute("data-s", s); sfx(s);
      if (s === "ANNOUNCING") { [].forEach.call(platesEl.children, function (el, k) { el.style.transitionDelay = (k * .15) + "s"; el.classList.add("on"); }); }
      if (s === "CELEBRATING") { wishEl.classList.add("on"); }
      changed();
    }
    function clearCur() {
      if (!cur) return;
      cur.items.forEach(function (it) { [it.man, it.girl, it.gift].forEach(function (o) { S.remove(o); o.traverse(function (c) { if (c.geometry) c.geometry.dispose(); if (c.material && c.material.dispose && !c.material.map) c.material.dispose(); }); }); });
      cur = null; platesEl.innerHTML = ""; wishEl.classList.remove("on"); wishEl.textContent = ""; STATE = "WAITING"; ov.setAttribute("data-s", "WAITING");
    }
    function play(batch, isReplay) {
      var used = {}, n = batch.length, now = performance.now();
      var scl = [1.42, 1.32, 1.22, 1.1, .98][n - 1], slot = 12.6 / n;
      var items = batch.map(function (e, k) {
        var ti = hash(e.id || e.name) % TITLES.length; while (used[ti]) ti = (ti + 1) % TITLES.length; used[ti] = 1;
        var mm = MEN.length ? MEN[nextMan++ % MEN.length] : { img: "" }, title = TITLES[ti];
        var fb = "assets/women/r" + (1 + hash(e.id || e.name) % 6) + ".webp";
        var man = makeMan(mm.img), girl = makeGirl(e.id ? "assets/women/" + e.id + ".webp" : fb, fb, title[1]), gift = makeGift();
        man.scale.setScalar(scl); girl.scale.setScalar(scl); gift.scale.setScalar(scl * 1.15);
        man.position.set(-12, 0, .6); girl.position.set(12, 0, .6); S.add(man, girl, gift);
        var cx = -6.3 + slot * (k + .5), d = Math.min(1.2, slot * .26);
        return { k: k, name: e.name, prize: e.prize, title: title, style: (nextStyle++) % STYLES.length, man: man, girl: girl, gift: gift, cx: cx, d: d, sc: scl, burst: 0 };
      });
      cur = { items: items, t0: now, n: n, batch: batch, replay: !!isReplay };
      platesEl.innerHTML = items.map(function (it) {
        var pz = it.prize || {}, ic = typeof w20IconHTML === "function" ? w20IconHTML(pz.icon, 20) : esc(pz.icon || "");
        return '<div class="s3pl"><div class="t">' + esc(it.title[0]) + '</div><div class="n">' + esc(shortName(it.name)) + '</div><div class="q">Đang mở quà bí mật…</div><div class="p">' + ic + " " + esc(pz.name || "Quà bí mật") + "</div></div>";
      }).join("");
      wishEl.textContent = n === 1 ? WISHES[hash(batch[0].id || batch[0].name) % WISHES.length].replace("{n}", callName(batch[0].name)) : "Chúc các chị em Phòng PTSPBL một ngày 20/10 thật rực rỡ!";
      STATE = "WAITING"; setState("ANNOUNCING");
      opt.onStart && opt.onStart(batch);
    }
    /* force = true: MC bấm "Trao tiếp" nên bỏ qua thời gian chờ gom người và bỏ qua trạng thái tạm dừng */
    function pump(force) {
      if (stopped || cur || !Q.length) return false; var now = performance.now();
      if (!force && (!running || (Q.length < 5 && now - Q[0].at < 1500))) return false;
      var batch = Q.splice(0, 5); last = batch.map(function (e) { return { id: e.id, name: e.name, prize: e.prize, demo: e.demo }; });
      play(batch, false); changed(); return true;
    }
    function animPair(it, t, now) {
      var m = it.man, g = it.girl, mu = m.userData, gu = g.userData, st = it.style, sc = it.sc;
      var mxT = it.cx - it.d, gxT = it.cx + it.d, k1 = ease(t / T1);
      var mx = lerp(-11, mxT, k1), gx = lerp(11, gxT, k1);
      var walking = t < T1, u = walking ? 0 : clamp01((t - T1) / (T2 - T1)), after = t >= T2, tt = t - T2;
      /* đặt lại tư thế */
      mu.body.position.y = 0; mu.body.rotation.x = 0; mu.torso.rotation.x = 0; gu.body.position.y = 0; gu.body.rotation.set(0, 0, 0); gu.torso.rotation.set(0, 0, 0);
      mu.A.forEach(function (a) { a.rotation.set(0, 0, 0); }); gu.A.forEach(function (a) { a.rotation.set(0, 0, 0); });
      mu.L.forEach(function (l) { l.rotation.set(0, 0, 0); }); gu.L.forEach(function (l) { l.rotation.set(0, 0, 0); });
      m.rotation.y = walking ? 1.2 : .55; g.rotation.y = walking ? -.75 : -.55;
      if (walking) {
        var ph = now / 120 + it.k; setWalk(m, ph, .6);
        mu.body.position.y = Math.abs(Math.sin(ph)) * .06;
        mu.A[0].rotation.x = -Math.sin(ph) * .5; mu.A[1].rotation.x = -1.1;
        /* chị bước vào kiểu công chúa: lướt nhẹ, váy đung đưa, một tay vẫy kiểu hoàng gia, tay kia chống eo */
        var pp = now / 260 + it.k; setWalk(g, pp, .12); gu.body.position.y = .03 + Math.sin(pp * 2) * .025; gu.body.rotation.z = Math.sin(pp) * .07; gu.torso.rotation.y = Math.sin(pp) * .15;
        gu.A[1].rotation.z = 2.3 + Math.sin(now / 170 + it.k) * .3; gu.A[1].rotation.x = -.3; gu.A[0].rotation.z = -.75; gu.A[0].rotation.x = .25;
      }
      var reach = 0, two = false, holdGirl = false;
      if (!walking && !after) {
        if (u < .3) { var cs = Math.sin(u / .3 * Math.PI); gu.body.position.y = -.12 * cs; gu.torso.rotation.x = .25 * cs; gu.A[0].rotation.z = -.6 * cs; gu.A[1].rotation.z = .6 * cs; } /* nhún chào kiểu công chúa */
        if (st === 0) { reach = ease(u); two = true; }
        else if (st === 1) { var dn = ease(clamp01(u * 3)) * (1 - ease(clamp01((u - .72) / .28))); mu.body.position.y = -.3 * dn; mu.L[0].rotation.x = -1.4 * dn; mu.L[1].rotation.x = .9 * dn; reach = ease(clamp01(u * 1.5)); two = true; }
        else if (st === 2) { mu.body.rotation.x = .38 * Math.sin(u * Math.PI); reach = ease(u); }
        else if (st === 3) { reach = ease(u); }
        else { mx = mxT + .3 * sc * ease(u); reach = ease(u); }
        mu.A[1].rotation.x = -1.1 - .45 * reach; if (two) mu.A[0].rotation.x = -1.1 - .45 * reach, mu.A[0].rotation.z = .25 * reach, mu.A[1].rotation.z = -.25 * reach;
        if (u > .4) { var gr = ease((u - .4) / .6); gu.A[0].rotation.x = -1.3 * gr; gu.A[1].rotation.x = -1.3 * gr; }
        holdGirl = u > .72;
      }
      if (after) {
        holdGirl = true;
        if (st === 4 && tt < 2600) {
          mx = mxT + .3 * sc; var sh = Math.sin(tt / 110) * .18; mu.A[1].rotation.x = -1.35 + sh; gu.A[0].rotation.x = -1.35 + sh; gu.A[1].rotation.x = -1.2; mu.A[0].rotation.x = 0;
        } else if (st === 3 && tt < 2600) {
          mu.A[1].rotation.z = 2.6 + Math.sin(tt / 120) * .35; gu.A[0].rotation.z = -2.0; gu.A[1].rotation.x = -1.2; gu.body.position.y = Math.abs(Math.sin(tt / 260)) * .25;
        } else {
          var cl = Math.sin(tt / 95 + it.k); mu.A[0].rotation.x = -1.25; mu.A[1].rotation.x = -1.25; var cz = .62 + (cl + 1) * .07; mu.A[0].rotation.z = cz; mu.A[1].rotation.z = -cz; /* hai bàn tay chạm nhau trước ngực */
          mu.body.position.y = Math.abs(Math.sin(tt / 200 + it.k)) * .08;
          gu.A[0].rotation.z = -2.0 + Math.sin(tt / 140 + it.k) * .3; gu.A[1].rotation.x = -1.2; gu.body.position.y = Math.abs(Math.sin(tt / 260 + it.k)) * .28;
        }
        if (!it.burst) { it.burst = 1; platesEl.children[it.k] && platesEl.children[it.k].classList.add("rev"); try { if (RM) throw 0; var rc = cv.getBoundingClientRect(), v = new T.Vector3(gx, 1.6, 0).project(CAM); FX.burst(rc.left + (v.x + 1) / 2 * rc.width, rc.top + (1 - v.y) / 2 * rc.height, cur.n > 2 ? 70 : 130); if (it.k === 0) FX.rain(); } catch (er) {} }
      }
      m.position.set(mx, 0, .6); g.position.set(gx, 0, .6);
      m.updateMatrixWorld(true); g.updateMatrixWorld(true);
      /* quà: luôn nằm trong tay người cầm */
      var mh = handPos(mu.A[1]), gp;
      if (two) { var mh2 = handPos(mu.A[0]); mh.lerp(mh2, .5); }
      if (!holdGirl) gp = mh;
      else {
        var gh = handPos(gu.A[0]).lerp(handPos(gu.A[1]), .5);
        if (after) gh = handPos(gu.A[1]);
        if (!after && u < .9) { gp = mh.clone().lerp(gh, ease((u - .72) / .18)); } else gp = gh;
      }
      it.gift.position.copy(gp); it.gift.position.y += (holdGirl ? -.3 : .1) * sc; if (holdGirl) it.gift.position.z += .25 * sc; it.gift.rotation.y = after ? .35 : now / 1200;
      var gd = it.gift.userData; if (gd) { var op = after ? ease((tt - 500) / 900) : 0; gd.lid.rotation.z = -op * 1.5; gd.lid.position.y = .15 + op * .05; gd.glow.material.opacity = op * (.75 + Math.sin(now / 160) * .15); gd.glow.scale.setScalar(.01 + op * .85); }
      fitFace(mu.head); fitFace(gu.head);
      var hh = gu.head.scale.y; gu.crown.position.y = gu.head.position.y + hh / 2 - .06; gu.crown.position.z = 0; gu.crown.renderOrder = 2; gu.crown.traverse(function (o) { if (o.material) { o.material.depthTest = false; o.renderOrder = 3; } });
    }

    /* ---------- vòng lặp ---------- */
    var raf = 0, t00 = performance.now(), visible = true, lastR = 0, io = null;
    function resize() {
      var w = wrap.clientWidth || W0, h = document.fullscreenElement === wrap ? wrap.clientHeight : Math.round(w * H0 / W0);
      R.setSize(w, h, false); cv.style.width = "100%"; cv.style.height = h + "px"; CAM.aspect = w / h; CAM.updateProjectionMatrix();
    }
    var onFs = function () { setTimeout(resize, 60); };
    resize(); window.addEventListener("resize", resize); document.addEventListener("fullscreenchange", onFs);
    if (window.IntersectionObserver) { io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }); io.observe(cv); }
    function frame(now) {
      if (stopped) return; raf = requestAnimationFrame(frame);
      if (document.hidden || !visible) return; /* tab ẩn hoặc sân khấu ngoài màn hình: không vẽ */
      if (!cur && now - lastR < 33) return; /* lúc chờ chỉ vẽ ~30 khung/giây */
      lastR = now; var ts = RM ? 0 : (now - t00) / 1000;
      CAM.position.set(Math.sin(ts * .12) * 1.4, 2.9 + Math.sin(ts * .2) * .12, 11.4); CAM.lookAt(0, 2.6, 0);
      if (!RM) {
        spots.forEach(function (s) { var a = Math.sin(ts * .6 + s.i * 2) * 2.2, focus = cur && (STATE === "ANNOUNCING" || STATE === "PRESENTING"); if (focus) a *= .25; s.l.target.position.x = s.x * .4 + a; s.l.intensity = focus ? 1.5 : .9; s.b.rotation.z = -a * .07 + s.x * -.05; s.b.position.x = s.x * .6 + a * .55; });
        bulbs.forEach(function (bm, i) { bm.material.color.copy(((Math.floor(ts * 2.5) + i) % 2) ? lc("#fff1c9") : lc("#f0c46a")); });
        balloons.forEach(function (b) { b.g.position.y = b.y + Math.sin(ts * .9 + b.i * 1.7) * .18; b.g.rotation.z = Math.sin(ts * .7 + b.i) * .08; });
      }
      if (cur) {
        var t = now - cur.t0;
        setState(t < ANN ? "ANNOUNCING" : t < ANN + T2 ? "PRESENTING" : t < ANN + T2 + CEL ? "CELEBRATING" : "COMPLETED");
        cur.items.forEach(function (it) { animPair(it, Math.max(0, t - ANN - it.k * 260), now); });
        if (t > ANN + T2 + CEL + COMP + cur.n * 260) { var e = cur; if (!e.replay) played += e.n; clearCur(); changed(); try { opt.onEnd && opt.onEnd(e); } catch (er) {} }
      } else if (Q.length) pump(false);
      R.render(S, CAM);
    }
    raf = requestAnimationFrame(frame);
    MEN.forEach(function (m) { tex(m.img); });
    return {
      /* e: {id, name, prize, demo?}. Không nhận lại cùng một người (trừ khi demo) để không trao quà hai lần */
      queue: function (e) {
        if (stopped || !e) return false; var key = e.id || e.name;
        if (!e.demo && key && SEEN[key]) return false;
        if (key && !e.demo) SEEN[key] = 1;
        e.at = performance.now(); Q.push(e);
        if (e.id) tex("assets/women/" + e.id + ".webp", "assets/women/r" + (1 + hash(key) % 6) + ".webp"); /* tải trước ảnh cho lượt sắp tới */
        changed(); return true;
      },
      size: function () { return Q.length + (cur ? cur.items.length : 0); },
      status: status,
      next: function () { return pump(true); },                 /* MC: trao tiếp ngay */
      replay: function () { if (stopped || cur || !last) return false; play(last.map(function (e) { var o = {}; for (var k in e) o[k] = e[k]; return o; }), true); changed(); return true; }, /* phát lại, không đụng dữ liệu */
      skip: function () { if (!cur) return false; cur.t0 = Math.min(cur.t0, performance.now() - (ANN + T2 + CEL + COMP + cur.n * 260 + 50)); return true; },
      setRunning: function (b) { running = !!b; changed(); },
      setSound: function (b) { soundOn = !!b; if (soundOn) { if (ac()) { tone(880, .25, "triangle", .08); tone(1320, .4, "triangle", .08, .12); } } changed(); },
      stop: function () {
        stopped = true; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("fullscreenchange", onFs);
        if (io) io.disconnect(); clearCur(); try { ov.remove(); } catch (e) {} try { if (AC) AC.close(); } catch (e) {} R.dispose();
      },
      titles: TITLES, styles: STYLES, is3d: true, states: ["WAITING", "ANNOUNCING", "PRESENTING", "CELEBRATING", "COMPLETED"]
    };
  }
  return { make: make, ok: ok };
})();

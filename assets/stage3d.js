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
    R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = .85;
    var S = new T.Scene(); S.background = new T.Color("#120a2c"); S.fog = new T.Fog("#120a2c", 22, 40);
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
    var GL = false; /* GL=true: vật liệu bóng như đồ chơi nhựa (nhân vật) */
    function mat(c, o) { o = o || {}; o.color = lc(c); if (o.emissive) o.emissive = lc(o.emissive); if (GL) { o.clearcoat = .7; o.clearcoatRoughness = .22; o.roughness = Math.min(o.roughness == null ? .5 : o.roughness, .4); return new T.MeshPhysicalMaterial(o); } return new T.MeshStandardMaterial(o); }
    function cvTex(w, h, fn) { var c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }

    /* ---------- ánh sáng: tông tím-hồng-xanh neon, đèn rọi vàng ấm ---------- */
    S.add(new T.AmbientLight("#c9b8ff", .4));
    S.add(new T.HemisphereLight("#ffd9f0", "#1a1050", .55));
    var key = new T.DirectionalLight("#fff0e0", .95); key.position.set(2, 9, 8); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); var sc0 = key.shadow.camera; sc0.left = -10; sc0.right = 10; sc0.top = 8; sc0.bottom = -3; sc0.near = 1; sc0.far = 30; key.shadow.bias = -.0008; S.add(key);
    var rimL = new T.PointLight("#ff4fb0", .9, 16); rimL.position.set(-6.5, 3, 1); S.add(rimL);
    var rimR = new T.PointLight("#4f9bff", .9, 16); rimR.position.set(6.5, 3, 1); S.add(rimR);
    var spots = [];
    [["#ffcf8a", 0, .8], ["#ff7ac8", -6, .6], ["#7ab8ff", 6, .6]].forEach(function (c, i) {
      var sp = new T.SpotLight(c[0], c[2], 28, .34, .7, 1.2); sp.position.set(c[1] * .8, 10, 5); sp.target.position.set(c[1] * .4, 0, 0); S.add(sp); S.add(sp.target);
      var beam = new T.Mesh(new T.ConeGeometry(i ? 1.5 : 3.2, 10, 28, 1, true), new T.MeshBasicMaterial({ color: c[0], transparent: true, opacity: i ? .04 : .05, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
      beam.position.set(c[1] * .6, 5, 2.5); S.add(beam); spots.push({ l: sp, b: beam, x: c[1], i: i });
    });

    /* ---------- sân khấu: bục tròn phát sáng + nền neon ---------- */
    var gloss = new T.Mesh(new T.PlaneGeometry(60, 40), mat("#150a34", { roughness: .25, metalness: .4 })); gloss.rotation.x = -Math.PI / 2; gloss.position.set(0, -.42, -4); gloss.receiveShadow = true; S.add(gloss);
    var podTex = cvTex(512, 512, function (g, w, h) { var r = g.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2); r.addColorStop(0, "#f2a8d4"); r.addColorStop(.7, "#e277b8"); r.addColorStop(1, "#c8509c"); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    var podium = new T.Group(); podium.position.set(0, 0, .3); podium.scale.set(1, 1, .45); S.add(podium);
    var pTop = new T.Mesh(new T.CylinderGeometry(7.4, 7.6, .4, 72), [mat("#ffb6dc", { roughness: .3, metalness: .15 }), new T.MeshStandardMaterial({ map: podTex, roughness: .28, metalness: .1 }), mat("#ffb6dc", { roughness: .3 })]); pTop.position.y = -.2; pTop.receiveShadow = true; podium.add(pTop);
    var rim = new T.Mesh(new T.TorusGeometry(7.45, .09, 12, 120), new T.MeshBasicMaterial({ color: "#ff6cc4" })); rim.rotation.x = Math.PI / 2; rim.position.y = .01; podium.add(rim);
    var rimGlow = new T.Mesh(new T.TorusGeometry(7.45, .34, 12, 120), new T.MeshBasicMaterial({ color: "#ff3fa8", transparent: true, opacity: .22, blending: T.AdditiveBlending, depthWrite: false })); rimGlow.rotation.x = Math.PI / 2; rimGlow.position.y = .01; podium.add(rimGlow);
    var rim2 = new T.Mesh(new T.TorusGeometry(6.8, .05, 10, 120), new T.MeshBasicMaterial({ color: "#7ab8ff", transparent: true, opacity: .8 })); rim2.rotation.x = Math.PI / 2; rim2.position.y = .012; podium.add(rim2);
    var back = cvTex(1024, 512, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "#c02a86"); gr.addColorStop(.35, "#6a2f86"); gr.addColorStop(.5, "#8a4a78"); gr.addColorStop(.65, "#33409e"); gr.addColorStop(1, "#1f2fb0"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      var vg = g.createRadialGradient(w / 2, h * .5, h * .15, w / 2, h * .5, w * .62); vg.addColorStop(0, "rgba(255,170,110,.18)"); vg.addColorStop(.5, "rgba(120,40,110,.0)"); vg.addColorStop(1, "rgba(10,4,30,.65)"); g.fillStyle = vg; g.fillRect(0, 0, w, h);
    });
    var wall = new T.Mesh(new T.PlaneGeometry(34, 16), new T.MeshBasicMaterial({ map: back })); wall.position.set(0, 6, -6); S.add(wall);
    /* ống neon chéo (lõi sáng + quầng sáng) */
    var neonGlow = glowTexN();
    function glowTexN() { var c = document.createElement("canvas"); c.width = 32; c.height = 128; var g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 32, 0); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(.5, "rgba(255,255,255,.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 128); return new T.CanvasTexture(c); }
    var neons = [];
    function neon(x, y, len, rot, col) {
      var g0 = new T.Group(), core = new T.Mesh(new T.CylinderGeometry(.07, .07, len, 10), new T.MeshBasicMaterial({ color: col })); g0.add(core);
      var halo = new T.Mesh(new T.PlaneGeometry(1.1, len), new T.MeshBasicMaterial({ map: neonGlow, color: col, transparent: true, opacity: .55, blending: T.AdditiveBlending, depthWrite: false })); halo.position.z = .05; g0.add(halo);
      g0.position.set(x, y, -5.2); g0.rotation.z = rot; S.add(g0); neons.push({ g: g0, m: halo.material }); return g0;
    }
    neon(-8.4, 7.2, 14, -.62, "#ff5cb8"); neon(-5.6, 8.6, 12, -.62, "#5cc8ff"); neon(-11, 4, 10, -.62, "#a05cff");
    neon(8.4, 7.2, 14, .62, "#5cc8ff"); neon(5.6, 8.6, 12, .62, "#ff5cb8"); neon(11, 4, 10, .62, "#7a8cff");
    /* biển neon tên chương trình */
    var banTex = cvTex(1024, 160, function (g, w, h) {
      g.fillStyle = "rgba(20,8,50,.9)"; g.beginPath(); g.moveTo(40, 12); g.lineTo(w - 40, 12); g.quadraticCurveTo(w - 6, h / 2, w - 40, h - 12); g.lineTo(40, h - 12); g.quadraticCurveTo(6, h / 2, 40, 12); g.fill();
      g.strokeStyle = "#ff6cc4"; g.lineWidth = 6; g.shadowColor = "#ff3fa8"; g.shadowBlur = 22; g.stroke(); g.shadowBlur = 0;
      g.fillStyle = "#fff4fb"; g.shadowColor = "#ff6cc4"; g.shadowBlur = 18; g.font = "800 70px 'Playfair Display',Georgia,serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("PTSPBL AWARDS | 20.10", w / 2, h / 2 + 4);
    });
    var banner = new T.Mesh(new T.PlaneGeometry(9.2, 1.44), new T.MeshBasicMaterial({ map: banTex, transparent: true })); banner.position.set(0, 6.55, -3.4); S.add(banner);
    var bulbs = [], balloons = [];
    /* pháo giấy 3D rơi nhẹ liên tục */
    var CN = 140, cpos = new Float32Array(CN * 3), ccol = new Float32Array(CN * 3), cspd = new Float32Array(CN), cpal = ["#ff5cb8", "#5cc8ff", "#ffd45c", "#ffffff", "#a05cff", "#7affc8"];
    for (var q = 0; q < CN; q++) { cpos[q * 3] = (Math.random() - .5) * 18; cpos[q * 3 + 1] = Math.random() * 10; cpos[q * 3 + 2] = -2 + Math.random() * 6; var cc = new T.Color(cpal[q % 6]); ccol[q * 3] = cc.r; ccol[q * 3 + 1] = cc.g; ccol[q * 3 + 2] = cc.b; cspd[q] = .4 + Math.random() * .8; }
    var cgeo = new T.BufferGeometry(); cgeo.setAttribute("position", new T.BufferAttribute(cpos, 3)); cgeo.setAttribute("color", new T.BufferAttribute(ccol, 3));
    var confetti = new T.Points(cgeo, new T.PointsMaterial({ size: .13, vertexColors: true, transparent: true, opacity: .9, depthWrite: false })); S.add(confetti);

    /* ---------- nhân vật ---------- */
    GL = true;
    var SKIN = "#f6d2b0", NAVY = "#2a2540", PANTS = "#221d38";
    function limb(r, len, col) { var g0 = new T.Group(), m = new T.Mesh(new T.CylinderGeometry(r, r * .92, len, 12), mat(col, { roughness: .7 })); m.position.y = -len / 2; m.castShadow = true; g0.add(m); var hnd = new T.Mesh(new T.SphereGeometry(r * 1.15, 12, 10), mat(SKIN, { roughness: .6 })); hnd.position.y = -len - r * .4; g0.add(hnd); g0.userData.hand = hnd; return g0; }
    function leg(r, len, col, shoe) { var g0 = new T.Group(), m = new T.Mesh(new T.CylinderGeometry(r, r, len, 12), mat(col, { roughness: .7 })); m.position.y = -len / 2; m.castShadow = true; g0.add(m); var sh = new T.Mesh(new T.BoxGeometry(r * 2.2, r * 1.1, r * 3.2), mat(shoe, { roughness: .4 })); sh.position.set(0, -len, r * .7); sh.castShadow = true; g0.add(sh); return g0; }
    function faceSprite(map, w) { var sp = new T.Sprite(new T.SpriteMaterial({ map: map, transparent: true, depthWrite: true, alphaTest: .05 })); sp.scale.set(w, w * 1.15, 1); sp.userData.w = w; return sp; }
    function fitFace(sp) { var im = sp.material.map && sp.material.map.image; var hH = 1.75; if (im && im.width) sp.scale.set(hH * im.width / im.height, hH, 1); /* mọi mặt cao bằng nhau */ sp.position.y = sp.userData.base + sp.scale.y / 2 - .14; sp.position.z = .05; }
    /* 10 bộ trang phục hoàng tử lịch sự, mỗi anh một kiểu (theo thứ tự anh trong danh sách) */
    var OUTFITS = [
      { j: "#1d46a8", t: "#f3d27a", s: "#ffffff", n: "cravat", nc: "#ffffff", p: "#17213f", e: ["epaulet"] },
      { j: "#7b1230", t: "#f3d27a", s: "#fff6ee", n: "bow", nc: "#14101a", p: "#26101c", e: ["brooch"] },
      { j: "#0d6b52", t: "#f3d27a", s: "#ffffff", n: "tie", nc: "#f3d27a", p: "#0c2c26", e: ["sash:#f3d27a"] },
      { j: "#f4efe4", t: "#d9b25a", s: "#ffffff", n: "cravat", nc: "#8fb8ff", p: "#d8d2c4", e: ["epaulet", "sash:#6fa4ff"] },
      { j: "#15151e", t: "#ffffff", s: "#ffffff", n: "bow", nc: "#d62839", p: "#0c0c12", e: ["lapel:#3a3a4a"] },
      { j: "#5a2f9e", t: "#e6e2f2", s: "#f5f0ff", n: "cravat", nc: "#cfc4f2", p: "#241a40", e: ["brooch", "epaulet:#e6e2f2"] },
      { j: "#4a4d5c", t: "#ff9ac4", s: "#ffffff", n: "tie", nc: "#ff9ac4", p: "#2a2c36", e: ["flower"] },
      { j: "#13244f", t: "#f3d27a", s: "#ffffff", n: "tie", nc: "#c0192d", p: "#0e1530", e: ["cape:#c0192d", "epaulet"] },
      { j: "#0f7f86", t: "#f3d27a", s: "#ffffff", n: "bow", nc: "#f3d27a", p: "#0e3a3e", e: ["brooch", "sash:#ffffff"] },
      { j: "#d8c08a", t: "#8a5a2a", s: "#fffaf0", n: "tie", nc: "#8a5a2a", p: "#6a5230", e: ["epaulet:#8a5a2a", "flower"] }
    ];
    function makeMan(img, oi) {
      var O = OUTFITS[(oi || 0) % OUTFITS.length], J = O.j, root = new T.Group(), body = new T.Group(); root.add(body);
      var L1 = leg(.1, .52, O.p, "#0f0f16"), L2 = leg(.1, .52, O.p, "#0f0f16"); L1.position.set(-.13, .62, 0); L2.position.set(.13, .62, 0); body.add(L1, L2);
      var torso = new T.Group(); torso.position.y = .55; body.add(torso);
      /* thân áo vest thon, vai rộng eo nhỏ (dáng thư sinh kiểu Hàn) */
      var jacket = new T.Mesh(new T.CylinderGeometry(.27, .2, .74, 28), mat(J, { roughness: .4 })); jacket.position.y = .36; jacket.scale.z = .78; jacket.castShadow = true; torso.add(jacket);
      var skirt = new T.Mesh(new T.CylinderGeometry(.2, .245, .2, 28), mat(J, { roughness: .4 })); skirt.position.y = .0; skirt.scale.z = .8; torso.add(skirt);
      var shirt = new T.Mesh(new T.ConeGeometry(.12, .4, 3), mat(O.s)); shirt.rotation.x = Math.PI; shirt.position.set(0, .56, .17); shirt.scale.z = .3; torso.add(shirt);
      [-1, 1].forEach(function (d) {
        var sh = new T.Mesh(new T.SphereGeometry(.1, 16, 12), mat(J, { roughness: .45 })); sh.position.set(d * .27, .68, 0); sh.castShadow = true; torso.add(sh);
        var lp = new T.Mesh(new T.BoxGeometry(.07, .34, .02), mat(O.t, { metalness: .5, roughness: .3 })); lp.position.set(d * .09, .5, .205); lp.rotation.z = d * .32; torso.add(lp);
      });
      [.42, .28, .14].forEach(function (y) { var bt = new T.Mesh(new T.SphereGeometry(.02, 10, 8), mat(O.t, { metalness: .85, roughness: .25 })); bt.position.set(.05, y, .205); torso.add(bt); });
      var belt = new T.Mesh(new T.CylinderGeometry(.205, .205, .035, 24), mat("#12101e", { roughness: .3 })); belt.position.y = .02; belt.scale.z = .8; torso.add(belt);
      /* cổ áo / nơ / cà vạt theo từng bộ */
      var nm = mat(O.nc, { roughness: .3 });
      if (O.n === "tie") { var tie = new T.Mesh(new T.BoxGeometry(.06, .34, .02), nm); tie.position.set(0, .45, .215); torso.add(tie); var kn = new T.Mesh(new T.BoxGeometry(.075, .055, .03), nm); kn.position.set(0, .64, .2); torso.add(kn); }
      else if (O.n === "bow") { [-1, 1].forEach(function (d) { var bw = new T.Mesh(new T.ConeGeometry(.055, .1, 4), nm); bw.rotation.z = d * -Math.PI / 2; bw.position.set(d * .06, .66, .2); torso.add(bw); }); var bk = new T.Mesh(new T.SphereGeometry(.03, 10, 8), nm); bk.position.set(0, .66, .21); torso.add(bk); }
      else { var cv = new T.Mesh(new T.SphereGeometry(.09, 14, 10), nm); cv.scale.set(1.2, .8, .6); cv.position.set(0, .62, .2); torso.add(cv); var cv2 = new T.Mesh(new T.ConeGeometry(.06, .22, 8), nm); cv2.rotation.x = Math.PI; cv2.position.set(0, .5, .21); cv2.scale.z = .4; torso.add(cv2); }
      /* phụ kiện hoàng tử */
      O.e.forEach(function (ex) {
        var pr = ex.split(":"), k = pr[0], col = pr[1] || O.t, em = mat(col, { metalness: .7, roughness: .3, emissive: col, emissiveIntensity: .15 });
        if (k === "epaulet") [-1, 1].forEach(function (d) { var ep = new T.Mesh(new T.BoxGeometry(.19, .04, .13), em); ep.position.set(d * .28, .78, 0); ep.rotation.z = d * -.25; torso.add(ep);
          for (var f = 0; f < 5; f++) { var fr = new T.Mesh(new T.CylinderGeometry(.01, .01, .09, 5), em); fr.position.set(d * (.34 + f * .001) + (f - 2) * .0, .73, (f - 2) * .026); fr.rotation.z = d * -.25; torso.add(fr); } });
        else if (k === "sash") { var sa = new T.Mesh(new T.BoxGeometry(.09, .78, .03), em); sa.position.set(0, .4, .2); sa.rotation.z = -.6; torso.add(sa); }
        else if (k === "cape") { var cp = new T.Mesh(new T.BoxGeometry(.58, .95, .025), mat(col, { roughness: .6, side: T.DoubleSide })); cp.position.set(0, .3, -.2); cp.rotation.x = .1; cp.castShadow = true; torso.add(cp); var cl = new T.Mesh(new T.TorusGeometry(.11, .025, 8, 16, Math.PI), em); cl.position.set(0, .74, .02); cl.rotation.x = -.2; torso.add(cl); }
        else if (k === "brooch") { var br = new T.Mesh(new T.SphereGeometry(.035, 12, 10), mat("#ffd24a", { metalness: .9, roughness: .2, emissive: "#6a4a00", emissiveIntensity: .35 })); br.position.set(-.15, .5, .22); torso.add(br); var gm = new T.Mesh(new T.SphereGeometry(.018, 10, 8), mat(O.nc, { emissive: O.nc, emissiveIntensity: .5 })); gm.position.set(-.15, .5, .25); torso.add(gm); }
        else if (k === "flower") { var fl = new T.Mesh(new T.SphereGeometry(.04, 12, 10), mat("#ff7aa8", { roughness: .4 })); fl.position.set(-.15, .5, .22); torso.add(fl); var fl2 = new T.Mesh(new T.SphereGeometry(.022, 10, 8), mat("#fff1b8")); fl2.position.set(-.15, .5, .255); torso.add(fl2); }
        else if (k === "lapel") { [-1, 1].forEach(function (d) { var ls = new T.Mesh(new T.BoxGeometry(.075, .36, .02), mat(col, { roughness: .2, metalness: .3 })); ls.position.set(d * .1, .5, .21); ls.rotation.z = d * .32; torso.add(ls); }); }
      });
      var A1 = limb(.075, .5, J), A2 = limb(.075, .5, J); A1.position.set(-.33, .68, 0); A2.position.set(.33, .68, 0); torso.add(A1, A2);
      var head = faceSprite(tex(img), 1.3); head.userData.base = .72; torso.add(head);
      root.userData = { body: body, torso: torso, L: [L1, L2], A: [A1, A2], head: head }; return root;
    }
    function makeGirl(img, fb, pal) {
      var root = new T.Group(), body = new T.Group(); root.add(body);
      var L1 = leg(.07, .28, SKIN, "#7a1a3a"), L2 = leg(.07, .28, SKIN, "#7a1a3a"); L1.position.set(-.12, .3, 0); L2.position.set(.12, .3, 0); body.add(L1, L2);
      var c1 = lc(pastel(pal[0], .22)), c2 = lc(pastel(pal[1], .18));
      var dress = new T.Mesh(new T.CylinderGeometry(.15, .52, .92, 36, 1, true), new T.MeshStandardMaterial({ color: c2, roughness: .35, metalness: .25, side: T.DoubleSide, emissive: c2, emissiveIntensity: .12 })); dress.position.y = .72; dress.castShadow = true; body.add(dress);
      var hem = new T.Mesh(new T.TorusGeometry(.51, .035, 8, 40), mat("#ffffff", { roughness: .3, metalness: .4 })); hem.rotation.x = Math.PI / 2; hem.position.y = .28; body.add(hem);
      var torso = new T.Group(); torso.position.y = 1.1; body.add(torso);
      var bod = new T.Mesh(new T.CylinderGeometry(.16, .125, .36, 20), new T.MeshStandardMaterial({ color: c1, roughness: .35, metalness: .25 })); bod.position.y = .1; bod.castShadow = true; torso.add(bod);
      var sash = new T.Mesh(new T.BoxGeometry(.08, .5, .03), mat("#fff3c4", { metalness: .5, roughness: .3, emissive: "#6a5000", emissiveIntensity: .3 })); sash.position.set(0, .04, .14); sash.rotation.z = .72; torso.add(sash);
      var sp = new T.Points(new T.BufferGeometry().setFromPoints(Array.from({ length: 60 }, function (_, i) { var a = i * 2.4, yy = .32 + (i * 37 % 60) / 60 * .82, rr = lerp(.52, .15, (yy - .28) / .9) + .02; return new T.Vector3(Math.cos(a) * rr, yy, Math.sin(a) * rr); })), new T.PointsMaterial({ color: "#ffffff", size: .05, transparent: true, opacity: .9 })); body.add(sp);
      /* tay áo bồng, nơ eo */
      [-1, 1].forEach(function (d) { var pf = new T.Mesh(new T.SphereGeometry(.1, 16, 12), new T.MeshStandardMaterial({ color: c1, roughness: .35, metalness: .2 })); pf.position.set(d * .19, .24, 0); pf.scale.set(.75, .7, .75); torso.add(pf); });
      var top2 = new T.Mesh(new T.SphereGeometry(.16, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: c1, roughness: .35, metalness: .25 })); top2.position.y = .27; top2.scale.y = .3; torso.add(top2);
      var bow = new T.Group(), bm2 = mat("#ffffff", { roughness: .35, metalness: .3 });
      [-1, 1].forEach(function (d) { var lb = new T.Mesh(new T.SphereGeometry(.07, 12, 10), bm2); lb.scale.set(1.3, .8, .5); lb.position.set(d * .08, 0, 0); bow.add(lb); });
      var bc = new T.Mesh(new T.SphereGeometry(.035, 10, 8), bm2); bow.add(bc); bow.position.set(0, -.08, .14); torso.add(bow);
      var waist = new T.Mesh(new T.TorusGeometry(.13, .022, 8, 24), bm2); waist.rotation.x = Math.PI / 2; waist.position.y = -.08; torso.add(waist);
      var A1 = limb(.08, .4, SKIN), A2 = limb(.08, .4, SKIN); A1.position.set(-.2, .26, 0); A2.position.set(.2, .26, 0); torso.add(A1, A2);
      var head = faceSprite(tex(img, fb), 1.3); head.userData.base = .3; torso.add(head);
      var crown = new T.Group(), gold = mat("#ffd24a", { metalness: .9, roughness: .2, emissive: "#6a4a00", emissiveIntensity: .4 });
      var band = new T.Mesh(new T.CylinderGeometry(.22, .22, .08, 20, 1, true), gold); crown.add(band);
      for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2, pk = new T.Mesh(new T.ConeGeometry(.05, .16 + (i === 0 ? .06 : 0), 6), gold); pk.position.set(Math.sin(a) * .22, .1, Math.cos(a) * .22); crown.add(pk); }
      var gem = new T.Mesh(new T.SphereGeometry(.04, 10, 8), mat("#ff4f86", { emissive: "#ff4f86", emissiveIntensity: .6 })); gem.position.set(0, .05, .23); crown.add(gem);
      torso.add(crown);
      root.userData = { body: body, torso: torso, L: [L1, L2], A: [A1, A2], head: head, crown: crown }; return root;
    }
    var GLOW = null;
    function glowTex() { if (GLOW) return GLOW; var c = document.createElement("canvas"); c.width = c.height = 128; var g = c.getContext("2d"), r = g.createRadialGradient(64, 64, 4, 64, 64, 64); r.addColorStop(0, "rgba(255,246,205,1)"); r.addColorStop(.4, "rgba(255,226,150,.55)"); r.addColorStop(1, "rgba(255,226,150,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); GLOW = new T.CanvasTexture(c); return GLOW; }
    GL = false;
    /* tim bay và bong bóng biểu cảm đáng yêu của anh em */
    var HEART = null, EMO = {}, EMOJIS = ["😍", "🥰", "😘", "🤩", "😊", "😻", "💖", "😆", "🥳", "😇"];
    function heartTex() { if (HEART) return HEART; var c = document.createElement("canvas"); c.width = c.height = 128; var g = c.getContext("2d"); g.translate(64, 62); g.scale(1.5, 1.5);
      var gr = g.createRadialGradient(-10, -14, 4, 0, 0, 46); gr.addColorStop(0, "#ffd0e6"); gr.addColorStop(.5, "#ff5fa0"); gr.addColorStop(1, "#d6246e"); g.fillStyle = gr;
      g.beginPath(); g.moveTo(0, 28); g.bezierCurveTo(-46, -4, -26, -40, 0, -16); g.bezierCurveTo(26, -40, 46, -4, 0, 28); g.fill(); g.fillStyle = "rgba(255,255,255,.55)"; g.beginPath(); g.ellipse(-16, -16, 7, 4, -.6, 0, 6.283); g.fill();
      HEART = new T.CanvasTexture(c); HEART.encoding = T.sRGBEncoding; return HEART; }
    function emoTex(ch) { if (EMO[ch]) return EMO[ch]; var c = document.createElement("canvas"); c.width = c.height = 192; var g = c.getContext("2d");
      g.fillStyle = "#fff"; g.shadowColor = "rgba(0,0,0,.35)"; g.shadowBlur = 10; g.beginPath(); g.arc(96, 90, 76, 0, 6.283); g.fill(); g.beginPath(); g.moveTo(52, 140); g.lineTo(34, 180); g.lineTo(86, 156); g.fill(); g.shadowBlur = 0;
      g.font = "100px 'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ch, 96, 96);
      var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; EMO[ch] = t; return t; }
    function makeFx(k) {
      var fx = new T.Group(), hs = [];
      for (var i = 0; i < 9; i++) { var sp = new T.Sprite(new T.SpriteMaterial({ map: heartTex(), transparent: true, depthWrite: false, opacity: 0 })); sp.userData.ph = i / 9; sp.userData.dx = (i % 3 - 1) * .5 + (Math.random() - .5) * .4; fx.add(sp); hs.push(sp); }
      var bub = new T.Sprite(new T.SpriteMaterial({ map: emoTex(EMOJIS[(k * 3 + Math.floor(Math.random() * 10)) % EMOJIS.length]), transparent: true, depthWrite: false, opacity: 0 })); bub.scale.set(.1, .1, 1); fx.add(bub);
      var bub2 = new T.Sprite(new T.SpriteMaterial({ map: emoTex(["💕", "✨", "💗", "😍"][Math.floor(Math.random() * 4)]), transparent: true, depthWrite: false, opacity: 0 })); bub2.scale.set(.1, .1, 1); fx.add(bub2);
      fx.userData = { hearts: hs, bub: bub, bub2: bub2 }; return fx;
    }
    function updFx(it, mx, gx, t, tt, after, presenting, now) {
      var fx = it.fx, u = fx.userData, sc = it.sc, on = presenting || after, mid = (mx + gx) / 2, k;
      u.hearts.forEach(function (h, i) {
        var ph = ((now / 1700) + h.userData.ph) % 1, a = on ? Math.sin(Math.min(1, ph) * Math.PI) : 0, big = after ? 1 : .6;
        h.position.set(mid + h.userData.dx * sc * .7 + Math.sin(ph * 6 + i) * .14, (1.8 + ph * 2.6) * sc * .85, 1.2); h.scale.setScalar((.28 + (i % 3) * .09) * sc * big); h.material.opacity = a * .95;
      });
      /* anh em: bong bóng biểu cảm nhún nhảy bên đầu */
      var pop = on ? ease((tt + 400) / 500) : 0, bob = Math.sin(now / 180) * .06;
      u.bub.position.set(mx - .95 * sc, 2.75 * sc * .9 + bob, 1.1); u.bub.scale.setScalar(.8 * sc * pop); u.bub.material.opacity = pop;
      var p2 = after ? ease((tt - 200) / 400) : 0; u.bub2.position.set(gx + .95 * sc, 2.8 * sc * .9 - bob, 1.1); u.bub2.scale.setScalar(.8 * sc * p2); u.bub2.material.opacity = p2;
    }
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
    ov.innerHTML = '<div class="s3vig"></div><div class="s3plates" aria-live="polite"></div><div class="s3wish"></div><div class="s3next"></div><div class="s3hold"></div>';
    wrap.style.position = "relative"; wrap.appendChild(ov);
    var platesEl = ov.querySelector(".s3plates"), wishEl = ov.querySelector(".s3wish"), nextEl = ov.querySelector(".s3next"), holdEl = ov.querySelector(".s3hold");
    if (!document.getElementById("s3css")) {
      var st = document.createElement("style"); st.id = "s3css";
      st.textContent = ".s3ov{position:absolute;inset:0;pointer-events:none;font-family:'Be Vietnam Pro',sans-serif}" +
        ".s3vig{position:absolute;inset:0;opacity:0;transition:opacity .6s;background:radial-gradient(ellipse at 50% 55%,rgba(0,0,0,0) 35%,rgba(0,22,18,.62) 100%)}.s3ov[data-s=ANNOUNCING] .s3vig,.s3ov[data-s=PRESENTING] .s3vig{opacity:1}" +
        ".s3plates{position:absolute;left:4%;right:4%;top:19%;display:flex;gap:1.2%;justify-content:center}" +
        ".s3pl{flex:1 1 0;max-width:46%;background:rgba(26,10,58,.9);border:2px solid #ff7ac8;border-radius:14px;box-shadow:0 0 18px rgba(255,90,190,.55),0 8px 22px rgba(0,0,0,.5);color:#fff;padding:.45em .45em;text-align:center;font-size:clamp(8px,1.3vw,16px);line-height:1.3;opacity:0;transform:translateY(-14px) scale(.9);transition:opacity .5s,transform .5s cubic-bezier(.2,1.4,.4,1)}" +
        ".s3pl.on{opacity:1;transform:none}.s3pl .t{font:700 1.08em 'Playfair Display',serif;color:#ffd0ec}.s3pl .n{font-weight:800;color:#fff}" +
        ".s3pl .p,.s3pl .q{font-weight:700;color:#ffe9a6;transition:opacity .5s}.s3pl .p{display:none;opacity:0}.s3pl .p img{height:1.5em!important;vertical-align:middle}.s3pl .q{color:#c9b8f0;font-style:italic}" +
        ".s3pl.rev .p{display:block;opacity:1}.s3pl.rev .q{display:none}" +
        ".s3wait{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);background:rgba(4,34,28,.62);border:1px solid rgba(240,214,140,.5);border-radius:16px;padding:.8em 1.4em;text-align:center;color:#fff8e6;font-size:clamp(11px,1.8vw,20px);transition:opacity .4s}" +
        ".s3wait b{display:block;font:700 1.3em 'Playfair Display',serif}.s3wait small{color:#f3dc9c;font-weight:600}.s3ov:not([data-s=WAITING]) .s3wait{opacity:0}" +
        ".s3wish{position:absolute;left:50%;bottom:3.5%;width:max-content;max-width:88%;transform:translateX(-50%) translateY(8px);padding:.35em 1.1em;border-radius:99px;background:rgba(4,34,28,.72);border:1px solid rgba(240,214,140,.55);text-align:center;color:#fff8e6;font:700 clamp(11px,1.7vw,22px)/1.35 'Playfair Display',serif;opacity:0;transform:translateY(8px);transition:all .6s}.s3wish.on{opacity:1;transform:translateX(-50%)}" +
        ".s3next{position:absolute;left:1.6%;top:30%;width:19%;font-size:clamp(9px,1.15vw,15px);color:#fff;background:rgba(18,8,48,.72);border:1.5px solid #5cc8ff;border-radius:12px;padding:.5em .6em;box-shadow:0 0 14px rgba(92,200,255,.4);transition:opacity .3s}.s3next:empty{opacity:0}.s3next b{display:block;color:#bfe9ff;letter-spacing:.05em;font-size:.9em;margin-bottom:.25em}.s3next div{display:flex;gap:.45em;align-items:baseline;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.s3next i{font-style:normal;font-weight:800;color:#ffd45c;min-width:1.1em}.s3next div:first-of-type span{font-weight:800;color:#ffe9a6}.s3next small{color:#c9b8f0}" +
        ".s3hold{display:none;position:absolute;left:50%;top:47%;transform:translate(-50%,-50%);width:80%;max-height:88%;overflow:hidden;background:rgba(14,6,40,.9);border:2px solid #ffd76a;border-radius:18px;padding:.7em 1em .9em;text-align:center;color:#fff;box-shadow:0 0 26px rgba(255,215,106,.5),0 10px 30px rgba(0,0,0,.6);font-size:clamp(8px,1.12vw,15px)}" +
        ".s3ov.holding .s3hold{display:block}.s3ov.holding .s3next,.s3ov:not([data-s=WAITING]) .s3next{display:none}" +
        ".s3hold .h1{font:800 1.45em 'Be Vietnam Pro',sans-serif;color:#ffe08a;letter-spacing:.02em;margin-bottom:.35em}.s3hold .h2{font:800 1.05em 'Be Vietnam Pro',sans-serif;color:#7fd6ff;margin:.7em 0 .35em;letter-spacing:.04em}" +
        ".s3hold .row{display:flex;flex-wrap:wrap;gap:.5em;justify-content:center}.s3hold .c{background:rgba(255,255,255,.1);border:1.5px solid rgba(255,122,200,.7);border-radius:12px;padding:.35em .7em;min-width:9.5em}.s3hold .nx .c{border-color:rgba(92,200,255,.75)}.s3hold .c b{display:block;font-weight:800}.s3hold .c small{color:#ffe9a6;font-weight:600}.s3hold .c i{font-style:normal;color:#ffd76a;font-weight:800;margin-right:.3em}" +
        ".stagewrap:fullscreen .s3hold{font-size:clamp(11px,1.35vw,24px)}" +
        ".stagewrap:fullscreen .s3pl{font-size:clamp(12px,1.6vw,26px)}.stagewrap:fullscreen .s3next{font-size:clamp(13px,1.5vw,24px)}";
      document.head.appendChild(st);
    }

    /* ---------- máy trạng thái: WAITING → ANNOUNCING → PRESENTING → CELEBRATING → COMPLETED ---------- */
    var MEN = (typeof W20CFG !== "undefined" && W20CFG.men) || [], Q = [], cur = null, last = null, nextMan = 0, nextStyle = 0, SEEN = {}, played = 0, BATCH = 5, since = [];
    var T1 = 1400, T2 = 2400, ANN = 600, CEL = 7500, COMP = 500, /* mỗi lượt khoảng 11 giây (0,6+2,4+7,5+0,5) */  STATE = "WAITING", running = false, soundOn = false, stopped = false, wishT = 0;
    var WISHES = ["Chúc {n} luôn xinh đẹp, rạng rỡ như ánh đèn sân khấu!", "Chúc {n} 20/10 thật vui, thật xinh và thật… ít việc!", "Chúc {n} luôn là ngôi sao sáng nhất Phòng PTSPBL!", "Chúc {n} cười thật tươi, deadline thật nhẹ!"];
    function callName(nm) { var w = String(nm || "").trim().split(/\s+/); return w.length > 1 ? w[0] + " " + w[w.length - 1] : (w[0] || "chị em"); }
    function status() { return { state: STATE, queue: Q.length, busy: !!cur, running: running, holding: !cur, auto: running, since: since.length, batch: BATCH, played: played, size: Q.length + (cur ? cur.items.length : 0), canReplay: !!last, sound: soundOn }; }
    function drawNext() {
      var L = Q.slice(0, 5); nextEl.innerHTML = L.length ? "<b>SẮP LÊN NHẬN QUÀ (" + Q.length + " chờ)</b>" + L.map(function (e, i) { return "<div><i>" + (i + 1) + "</i><span>" + esc(shortName(e.name)) + "</span></div>"; }).join("") : "";
    }
    function drawHold() {
      var on = !cur; ov.classList.toggle("holding", on); if (!on) return;
      var full = since.length > 0, nx = Q.slice(0, 5);
      var chip = function (e, i, n) { var pz = e.prize || {}, ic = typeof w20IconHTML === "function" && pz.icon ? w20IconHTML(pz.icon, 18) : ""; return '<div class="c"><b>' + (n ? "<i>" + (i + 1) + "</i>" : "") + esc(shortName(e.name)) + "</b><small>" + ic + " " + esc(pz.name || "") + "</small></div>"; };
      holdEl.innerHTML = '<div class="h1">' + (full ? "📸 MỜI " + since.length + " CHỊ ĐỨNG LÊN NHẬN QUÀ &amp; CHỤP ẢNH" : "⏳ ĐANG CHỜ MC MỜI LƯỢT ĐẦU TIÊN") + "</div>" +
        (since.length ? '<div class="row">' + since.map(function (e, i) { return chip(e, i, 0); }).join("") + "</div>" : "") +
        '<div class="h2">⏭ ' + (nx.length ? nx.length + " NGƯỜI TIẾP THEO" : "CHƯA CÓ AI TRONG HÀNG CHỜ") + (Q.length > 5 ? " (còn " + Q.length + " chờ)" : "") + "</div>" +
        (nx.length ? '<div class="row nx">' + nx.map(function (e, i) { return chip(e, i, 1); }).join("") + "</div>" : "");
    }
    function changed() { drawNext(); drawHold(); try { opt.onChange && opt.onChange(status()); } catch (e) {} }

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
      cur.items.forEach(function (it) { [it.man, it.girl, it.gift, it.fx].forEach(function (o) { S.remove(o); o.traverse(function (c) { if (c.geometry) c.geometry.dispose(); if (c.material && c.material.dispose && !c.material.map) c.material.dispose(); }); }); });
      cur = null; platesEl.innerHTML = ""; wishEl.classList.remove("on"); wishEl.textContent = ""; STATE = "WAITING"; ov.setAttribute("data-s", "WAITING");
    }
    var lastMan = -1;
    function pickMan() { if (!MEN.length) return 0; var k, g = 0; do { k = Math.floor(Math.random() * MEN.length); } while (MEN.length > 1 && k === lastMan && ++g < 20); lastMan = k; return k; }
    function play(batch, isReplay) {
      var used = {}, n = batch.length, now = performance.now();
      var scl = [1.38, 1.42, 1.3, 1.16, 1.02][n - 1], slot = 12.6 / n;
      var items = batch.map(function (e, k) {
        var ti = hash(e.id || e.name) % TITLES.length; while (used[ti]) ti = (ti + 1) % TITLES.length; used[ti] = 1;
        var mi = pickMan(), mm = MEN.length ? MEN[mi] : { img: "" }, title = TITLES[ti];
        var fb = "assets/women/r" + (1 + hash(e.id || e.name) % 6) + ".webp";
        var man = makeMan(mm.img, mi), girl = makeGirl(e.id ? "assets/women/" + e.id + ".webp" : fb, fb, title[1]), gift = makeGift();
        man.scale.setScalar(scl); girl.scale.setScalar(scl); gift.scale.setScalar(scl * 1.15);
        man.position.set(-12, 0, .6); girl.position.set(12, 0, .6); S.add(man, girl, gift);
        var cx = -6.3 + slot * (k + .5), d = Math.min(1.2, slot * .26);
        return { k: k, id: e.id, name: e.name, prize: e.prize, title: title, style: (nextStyle++) % STYLES.length, man: man, girl: girl, gift: gift, fx: makeFx(k), cx: cx, d: d, sc: scl, burst: 0 };
      });
      items.forEach(function (it) { S.add(it.fx); });
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
    function pump(force, cnt) {
      if (stopped || cur || !Q.length) return false;
      if (!force && !(running && Q.length >= BATCH)) return false; /* chế độ tự động: chỉ khi đủ một lượt */
      var batch = Q.splice(0, Math.max(1, Math.min(cnt || BATCH, 5, Q.length))); /* một lượt, nhiều người lên cùng lúc */
      last = batch.map(function (e) { return { id: e.id, name: e.name, prize: e.prize, demo: e.demo }; });
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
        mu.body.position.y = Math.abs(Math.sin(ph)) * .025;
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
          mx = mxT + .3 * sc; var sh = Math.sin(tt / 130) * .07; mu.A[1].rotation.x = -1.35 + sh; gu.A[0].rotation.x = -1.35 + sh; gu.A[1].rotation.x = -1.2; mu.A[0].rotation.x = 0;
        } else if (st === 3 && tt < 2600) {
          mu.A[1].rotation.z = 2.6 + Math.sin(tt / 140) * .14; gu.A[0].rotation.z = -2.0; gu.A[1].rotation.x = -1.2; gu.body.position.y = Math.abs(Math.sin(tt / 260)) * .25;
        } else {
          var cl = Math.sin(tt / 95 + it.k); mu.A[0].rotation.x = -1.25; mu.A[1].rotation.x = -1.25; var cz = .62 + (cl + 1) * .03; mu.A[0].rotation.z = cz; mu.A[1].rotation.z = -cz; /* hai bàn tay chạm nhau trước ngực */
          mu.body.position.y = Math.abs(Math.sin(tt / 240 + it.k)) * .025;
          gu.A[0].rotation.z = -2.0 + Math.sin(tt / 140 + it.k) * .3; gu.A[1].rotation.x = -1.2; gu.body.position.y = Math.abs(Math.sin(tt / 260 + it.k)) * .28;
        }
        if (!it.burst) { it.burst = 1; platesEl.children[it.k] && platesEl.children[it.k].classList.add("rev"); try { if (RM) throw 0; var rc = cv.getBoundingClientRect(), v = new T.Vector3(gx, 1.6, 0).project(CAM); FX.burst(rc.left + (v.x + 1) / 2 * rc.width, rc.top + (1 - v.y) / 2 * rc.height, cur.n > 2 ? 70 : 130); if (it.k === 0) FX.rain(); } catch (er) {} }
      }
      m.position.set(mx, 0, .6); g.position.set(gx, 0, .6);
      var onP = !walking, cel = after;
      if (onP && !RM) { var wg = Math.sin(now / 170 + it.k), wm = wg * (cel ? .015 : .008), wig = wg * (cel ? .05 : .025); mu.torso.rotation.z += wm; mu.head.material.rotation = wm * .8; gu.torso.rotation.z += -wig * .6; } /* nghiêng đầu đáng yêu */
      updFx(it, mx, gx, t, tt, after, onP && !after, now);
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
      var gd = it.gift.userData; if (gd) { var op = after ? ease((tt - 200) / 700) : 0; gd.lid.rotation.z = -op * 1.5; gd.lid.position.y = .15 + op * .05; gd.glow.material.opacity = op * (.75 + Math.sin(now / 160) * .15); gd.glow.scale.setScalar(.01 + op * .85); }
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
        neons.forEach(function (n, i) { n.m.opacity = .5 + Math.sin(ts * 1.6 + i) * .12; });
        rimGlow.material.opacity = .2 + Math.sin(ts * 2) * .06;
        var cp = cgeo.attributes.position, dt = 1 / 30; for (var q = 0; q < CN; q++) { var y = cp.getY(q) - cspd[q] * dt; if (y < -.3) y = 9 + Math.random(); cp.setY(q, y); cp.setX(q, cp.getX(q) + Math.sin(ts * 1.3 + q) * .004); } cp.needsUpdate = true;
      }
      if (cur) {
        var t = now - cur.t0;
        setState(t < ANN ? "ANNOUNCING" : t < ANN + T2 ? "PRESENTING" : t < ANN + T2 + CEL ? "CELEBRATING" : "COMPLETED");
        cur.items.forEach(function (it) { animPair(it, Math.max(0, t - ANN - it.k * 260), now); });
        if (t > ANN + T2 + CEL + COMP) { var e = cur; if (!e.replay) { played += e.n; since = e.items.map(function (it) { return { id: it.id, name: it.name, prize: it.prize }; }); } clearCur(); changed(); try { opt.onEnd && opt.onEnd(e); } catch (er) {} }
      } else if (Q.length) pump(false);
      R.render(S, CAM);
    }
    raf = requestAnimationFrame(frame);
    MEN.forEach(function (m) { tex(m.img); });
    return {
      /* e: {id, name, prize, demo?}. Không nhận lại cùng một người (trừ khi demo) để không trao quà hai lần */
      queue: function (e, opt2) {
        if (stopped || !e) return false; var key = e.id || e.name;
        if (!e.demo && key && SEEN[key]) return false;
        if (key && !e.demo) SEEN[key] = 1;
        e.at = performance.now();
        if (opt2 && opt2.front) Q.unshift(e); else if (e.ts) { var ix = Q.length; while (ix > 0 && Q[ix - 1].ts && Q[ix - 1].ts > e.ts) ix--; Q.splice(ix, 0, e); } else Q.push(e); /* ai quay trước thì lên trước */
        if (e.id) tex("assets/women/" + e.id + ".webp", "assets/women/r" + (1 + hash(key) % 6) + ".webp"); /* tải trước ảnh cho lượt sắp tới */
        changed(); return true;
      },
      size: function () { return Q.length + (cur ? cur.items.length : 0); },
      status: status,
      peek: function (n) { return Q.slice(0, n || 5).map(function (e) { return { id: e.id, name: e.name, prize: e.prize, ts: e.ts }; }); },
      next: function (n) { return pump(true, n); },            /* MC: mời lượt tiếp theo (n người, mặc định = số người mỗi lượt) */
      replay: function () { if (stopped || cur || !last) return false; play(last.map(function (e) { var o = {}; for (var k in e) o[k] = e[k]; return o; }), true); changed(); return true; }, /* phát lại, không đụng dữ liệu */
      skip: function () { if (!cur) return false; cur.t0 = Math.min(cur.t0, performance.now() - (ANN + T2 + CEL + COMP + 50)); return true; },
      setRunning: function (b) { running = !!b; changed(); },
      setBatch: function (n) { n = Math.round(Number(n)); BATCH = n >= 1 && n <= 5 ? n : 5; changed(); },
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

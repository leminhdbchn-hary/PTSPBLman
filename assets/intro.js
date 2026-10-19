/* Cảnh mở đầu của trang chị em / trang Sếp: chibi (đầu = ảnh cắt assets/women/<mã>.webp) đi tới cơ quan Vietcombank.
   kind "staff": đồng phục áo trắng, váy xanh đen; một món quà bất ngờ rơi xuống tay, chạm để mở.
   kind "sep": áo dài; một lá thư rơi xuống tay, chạm để đọc rồi vào cảnh phê duyệt.
   W20Intro.mount(host, { kind, face, hint, lines, onOpen }) → { skip(), destroy() } */
var W20Intro = (function () {
  var V = (function () { try { var m = /[?&]v=([^&]+)/.exec(document.currentScript.src); return m ? m[1] : "1"; } catch (e) { return "1"; } })();
  var RM = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var WALK = 2600, DROP = 3000; /* mili giây: đi bộ, rồi quà/thư rơi */

  var CSS = ".w20i{position:relative;width:min(94vw,430px);margin:0 auto;user-select:none;-webkit-user-select:none;cursor:pointer;-webkit-tap-highlight-color:transparent}" +
    ".w20i svg{display:block;width:100%;height:auto;max-height:50vh;border-radius:22px;box-shadow:0 14px 34px rgba(0,30,20,.45)}" +
    ".w20i .cl{animation:w20cl 26s linear infinite}.w20i .cl2{animation-duration:38s;animation-delay:-14s}@keyframes w20cl{from{transform:translateX(-80px)}to{transform:translateX(480px)}}" +
    ".w20i .walk{transform:translateX(-200px)}.w20i.go .walk{animation:w20walk " + WALK + "ms cubic-bezier(.35,.1,.45,1) forwards}@keyframes w20walk{to{transform:translateX(0)}}" +
    ".w20i .bob{transform:translateY(0)}.w20i.go:not(.arr) .bob{animation:w20bob .46s ease-in-out infinite}@keyframes w20bob{50%{transform:translateY(-4px)}}" +
    ".w20i .lg,.w20i .ar{transform:rotate(0)}" +
    ".w20i.go:not(.arr) .lg.l{animation:w20lgl .46s ease-in-out infinite alternate}.w20i.go:not(.arr) .lg.r{animation:w20lgr .46s ease-in-out infinite alternate}" +
    ".w20i.go:not(.arr) .ar.l{animation:w20arl .46s ease-in-out infinite alternate}.w20i.go:not(.arr) .ar.r{animation:w20arr .46s ease-in-out infinite alternate}" +
    "@keyframes w20lgl{from{transform:rotate(-22deg)}to{transform:rotate(22deg)}}@keyframes w20lgr{from{transform:rotate(22deg)}to{transform:rotate(-22deg)}}" +
    "@keyframes w20arl{from{transform:rotate(20deg)}to{transform:rotate(-20deg)}}@keyframes w20arr{from{transform:rotate(-20deg)}to{transform:rotate(20deg)}}" +
    ".w20i .ar{transition:transform .45s cubic-bezier(.3,.8,.3,1)}.w20i.hold .ar.l{transform:rotate(-42deg)}.w20i.hold .ar.r{transform:rotate(42deg)}" +
    ".w20i .item{opacity:0}.w20i.drop .item{opacity:1;animation:w20fall " + DROP + "ms cubic-bezier(.33,.5,.4,1) both}" +
    "@keyframes w20fall{0%{transform:translate(-190px,-350px) rotate(-32deg)}14%{transform:translate(70px,-300px) rotate(28deg)}30%{transform:translate(-80px,-228px) rotate(-26deg)}46%{transform:translate(64px,-160px) rotate(20deg)}62%{transform:translate(-44px,-98px) rotate(-14deg)}78%{transform:translate(26px,-48px) rotate(8deg)}90%{transform:translate(-8px,-14px) rotate(-3deg)}100%{transform:translate(0,0) rotate(0)}}" +
    ".w20i.ready .item{animation:none;opacity:1}.w20i.ready .item .fl{animation:w20float 2.2s ease-in-out infinite}@keyframes w20float{50%{transform:translateY(-4px)}}" +
    ".w20i .wing{animation:w20flap .34s ease-in-out infinite alternate}.w20i.ready .wing{animation-duration:.7s}@keyframes w20flap{from{transform:rotate(-18deg)}to{transform:rotate(10deg)}}" +
    ".w20i .halo{opacity:0}.w20i.ready .halo{opacity:1;animation:w20halo 1.6s ease-in-out infinite}@keyframes w20halo{50%{opacity:.45}}" +
    ".w20i .sp{opacity:0}.w20i.drop .sp,.w20i.ready .sp{animation:w20tw 1.1s ease-in-out infinite}.w20i .sp:nth-child(2n){animation-delay:.4s}.w20i .sp:nth-child(3n){animation-delay:.75s}@keyframes w20tw{0%,100%{opacity:0;transform:scale(.3)}50%{opacity:1;transform:scale(1)}}" +
    ".w20i .wind{opacity:0;transition:opacity .7s}.w20i.go:not(.ready) .wind{opacity:.5}.w20i.drop:not(.ready) .wind{opacity:1}.w20i .wd{fill:none;stroke:#fff;stroke-width:2.6;stroke-linecap:round;stroke-dasharray:70 420;stroke-dashoffset:420;animation:w20wd 1.7s ease-in-out infinite}.w20i .wd:nth-child(2){animation-delay:.35s;stroke-width:2}.w20i .wd:nth-child(3){animation-delay:.7s}.w20i .wd:nth-child(4){animation-delay:1.05s;stroke-width:2}.w20i .wd:nth-child(5){animation-delay:.2s}@keyframes w20wd{0%{stroke-dashoffset:420;opacity:0}15%{opacity:.8}80%{opacity:.7}100%{stroke-dashoffset:-260;opacity:0}}" +
    ".w20i .bp{animation:w20bp 3.4s linear infinite;opacity:0}.w20i.go:not(.ready) .bp{opacity:.9}@keyframes w20bp{from{transform:translate(-40px,0) rotate(0)}to{transform:translate(470px,64px) rotate(620deg)}}" +
    ".w20i .snd{position:absolute;right:10px;top:10px;z-index:3;border:1.5px solid rgba(255,255,255,.7);border-radius:99px;background:rgba(0,40,30,.55);color:#fff;font:700 12.5px 'Be Vietnam Pro',sans-serif;padding:5px 11px;cursor:pointer;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}.w20i .snd.off{animation:w20sp 1.8s ease-in-out infinite}@keyframes w20sp{50%{box-shadow:0 0 0 5px rgba(255,255,255,.25)}}" +
    ".w20i.skip *{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important}" +
    ".w20i.open .item .fl{animation:w20pop .5s ease-out forwards}@keyframes w20pop{to{transform:scale(1.7);opacity:0}}" +
    ".w20i .ltr{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:14px}.w20i.read .ltr{display:flex}" +
    ".w20i .paper{background:#fffdf4;color:#3b2f1d;border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.45);padding:14px 16px 12px;width:min(88%,330px);font:500 13.5px/1.45 'Be Vietnam Pro',sans-serif;text-align:left;border-top:5px solid #0b8a4a;animation:w20pp .6s cubic-bezier(.2,.9,.3,1) both}" +
    ".w20i .paper h4{margin:0 0 4px;text-align:center;font:700 17px 'Playfair Display',Georgia,serif;letter-spacing:.08em;color:#0b6e3c}.w20i .paper p{margin:3px 0;opacity:0;animation:w20ln .5s ease-out forwards}.w20i .paper p:nth-of-type(2){animation-delay:.5s}.w20i .paper p:nth-of-type(3){animation-delay:1s}.w20i .paper p:nth-of-type(4){animation-delay:1.5s}.w20i .paper p:nth-of-type(1){animation-delay:.2s}" +
    "@keyframes w20pp{from{transform:translateY(40px) scale(.7);opacity:0}}@keyframes w20ln{to{opacity:1}}";

  function css() { if (document.getElementById("w20intro-css")) return; var s = document.createElement("style"); s.id = "w20intro-css"; s.textContent = CSS; document.head.appendChild(s); }

  function building() {
    var win = "";
    for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) win += '<rect x="' + (212 + c * 34) + '" y="' + (128 + r * 28) + '" width="26" height="19" rx="3" fill="url(#wg)"/>';
    return '<rect x="0" y="0" width="400" height="360" fill="url(#sky)"/><circle cx="68" cy="62" r="26" fill="#fff7c7" opacity=".9"/><circle cx="68" cy="62" r="40" fill="#fff7c7" opacity=".28"/>' +
      '<g class="cl" opacity=".9"><ellipse cx="60" cy="40" rx="30" ry="9" fill="#fff"/><ellipse cx="82" cy="34" rx="20" ry="9" fill="#fff"/></g><g class="cl cl2" opacity=".75"><ellipse cx="40" cy="92" rx="26" ry="8" fill="#fff"/><ellipse cx="60" cy="86" rx="16" ry="8" fill="#fff"/></g>' +
      /* nhà xa */
      '<g fill="#b9dccf"><rect x="10" y="190" width="46" height="112"/><rect x="62" y="215" width="38" height="87"/><rect x="104" y="170" width="52" height="132"/></g><g fill="#a5cfc0"><rect x="22" y="204" width="8" height="8"/><rect x="36" y="204" width="8" height="8"/><rect x="118" y="186" width="8" height="8"/><rect x="134" y="186" width="8" height="8"/><rect x="118" y="206" width="8" height="8"/></g>' +
      /* toà nhà Vietcombank */
      '<rect x="196" y="48" width="190" height="258" fill="#e8f3f1"/><rect x="196" y="48" width="190" height="258" fill="url(#bd)"/>' +
      '<rect x="196" y="78" width="190" height="38" fill="#0b8a4a"/><rect x="196" y="112" width="190" height="4" fill="#086b39"/><text x="291" y="104" text-anchor="middle" font-family="Be Vietnam Pro,Arial,sans-serif" font-weight="800" font-size="21" letter-spacing="1.5" fill="#fff">VIETCOMBANK</text>' +
      win +
      '<rect x="196" y="240" width="190" height="4" fill="#cfe3de"/>' +
      /* cửa kính + mái che */
      '<rect x="252" y="246" width="78" height="60" fill="#2b6f73"/><rect x="254" y="248" width="35" height="58" fill="url(#gl)"/><rect x="293" y="248" width="35" height="58" fill="url(#gl)"/><rect x="288" y="252" width="3" height="48" fill="#cfeae6"/><rect x="244" y="232" width="94" height="14" rx="3" fill="#0b8a4a"/><rect x="244" y="244" width="94" height="3" fill="#06502a" opacity=".5"/>' +
      /* cờ trên nóc */
      '<rect x="362" y="14" width="2.5" height="36" fill="#8a8f93"/><path d="M364.5 15h26v16h-26z" fill="#da251d"/><polygon points="377.5,18 379.2,23.2 384.6,23.2 380.2,26.4 381.9,31.6 377.5,28.4 373.1,31.6 374.8,26.4 370.4,23.2 375.8,23.2" fill="#ffde00"/>' +
      /* cây hoa */
      '<rect x="368" y="270" width="5" height="34" fill="#7a5233"/><circle cx="370" cy="262" r="20" fill="#3fa365"/><circle cx="360" cy="270" r="10" fill="#ff9fc0"/><circle cx="381" cy="258" r="9" fill="#ff9fc0"/><circle cx="374" cy="272" r="7" fill="#ffd1e0"/>' +
      '<rect x="14" y="262" width="5" height="40" fill="#7a5233"/><circle cx="16" cy="252" r="22" fill="#3fa365"/><circle cx="6" cy="260" r="10" fill="#ff9fc0"/><circle cx="27" cy="246" r="9" fill="#ff9fc0"/><circle cx="18" cy="264" r="7" fill="#ffd1e0"/>' +
      /* vỉa hè */
      '<rect x="0" y="300" width="400" height="60" fill="#d8dad6"/><rect x="0" y="300" width="400" height="5" fill="#bfc3bd"/><rect x="0" y="330" width="400" height="30" fill="#c6c9c3"/><g fill="#b3b7b0"><rect x="40" y="338" width="60" height="4" rx="2"/><rect x="170" y="338" width="60" height="4" rx="2"/><rect x="300" y="338" width="60" height="4" rx="2"/></g>' +
      '<g><rect x="120" y="283" width="24" height="17" rx="3" fill="#0b8a4a"/><circle cx="126" cy="278" r="6" fill="#ff7fa8"/><circle cx="134" cy="275" r="6" fill="#ffd35a"/><circle cx="141" cy="279" r="5" fill="#ff7fa8"/></g>';
  }

  function head(face) { /* đầu chibi: ảnh cắt theo đầu và tóc, đáy ở cổ */
    return face ? '<image class="hd" href="' + face + '" x="-54" y="-212" width="108" height="112" preserveAspectRatio="xMidYMax meet"/>' :
      '<g><ellipse cx="0" cy="-158" rx="46" ry="50" fill="#2a2230"/><ellipse cx="0" cy="-152" rx="40" ry="44" fill="#ffe2d1"/><path d="M-42 -160 Q-40 -204 0 -204 Q40 -204 42 -160 Q28 -184 8 -178 Q-14 -172 -42 -160Z" fill="#2a2230"/><ellipse cx="-15" cy="-150" rx="5" ry="7" fill="#2a2230"/><ellipse cx="15" cy="-150" rx="5" ry="7" fill="#2a2230"/><circle cx="-26" cy="-138" r="7" fill="#ff9db3" opacity=".6"/><circle cx="26" cy="-138" r="7" fill="#ff9db3" opacity=".6"/><path d="M-7 -133 Q0 -126 7 -133" fill="none" stroke="#c2455f" stroke-width="3" stroke-linecap="round"/></g>';
  }

  var AD = [["#e8458a", "#c22d6d", "#ffd0e2"], ["#8e63d2", "#6a43ad", "#e4d3ff"], ["#f2a23a", "#d4811a", "#ffe3b3"], ["#2aa5d6", "#1b82b0", "#c9eefc"], ["#e5505b", "#bf3640", "#ffd0d4"], ["#3cb878", "#26935a", "#cdf5df"], ["#f0cf3c", "#cfa91c", "#fff3b0"], ["#ff8a65", "#e0623e", "#ffd9cb"], ["#17a589", "#0f7d68", "#7fe0c8"], ["#4f7de0", "#3459b8", "#d3e0ff"]];
  function adIdx(id) { var h = 0, t = String(id || "x"); for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h % AD.length; }
  function windSvg() { /* vệt gió và cánh hoa bay ngang qua cảnh */
    var w = '<g class="wind" pointer-events="none">';
    [[-30, 88, 100, 70, 200, 104, 300, 84, 430, 96], [-30, 138, 90, 118, 210, 150, 310, 128, 430, 142], [-30, 190, 110, 170, 220, 204, 320, 180, 430, 196], [-30, 236, 100, 218, 200, 248, 300, 230, 430, 242], [-30, 112, 120, 96, 230, 126, 330, 110, 430, 120]].forEach(function (q) {
      w += '<path class="wd" d="M' + q[0] + ' ' + q[1] + ' C' + q[2] + ' ' + q[3] + ',' + q[4] + ' ' + q[5] + ',' + q[6] + ' ' + q[7] + ' S' + (q[8] - 40) + ' ' + (q[9] + 10) + ',' + q[8] + ' ' + q[9] + '"/>'; });
    w += '</g><g pointer-events="none">';
    [[40, 'ffb3cc', 0], [90, 'ffd1e0', 1.1], [160, 'ff9fc0', .5], [210, 'ffd1e0', 2], [120, 'ffc2d6', 1.6], [250, 'ffb3cc', 2.6]].forEach(function (q, i) {
      w += '<ellipse class="bp" cx="0" cy="' + q[0] + '" rx="6" ry="3.4" fill="#' + q[1] + '" style="animation-delay:' + q[2] + 's;animation-duration:' + (3 + i * .35) + 's"/>'; });
    return w + '</g>'; }
  function chibi(kind, face, id) {
    var SKIN = "#ffe2d1", staff = false, body, CL = AD[adIdx(id)], sleeve = CL[0], arm = 34; /* tất cả đều mặc áo dài, mỗi người một màu */
    var legs = staff ?
      '<g transform="translate(-9,-36)"><g class="lg l"><rect x="-5.5" y="0" width="11" height="32" rx="5" fill="' + SKIN + '"/><ellipse cx="0" cy="33" rx="10" ry="5" fill="#20242b"/></g></g><g transform="translate(9,-36)"><g class="lg r"><rect x="-5.5" y="0" width="11" height="32" rx="5" fill="' + SKIN + '"/><ellipse cx="0" cy="33" rx="10" ry="5" fill="#20242b"/></g></g>' :
      '<g transform="translate(-9,-36)"><g class="lg l"><rect x="-8" y="0" width="16" height="34" rx="5" fill="#fffdf8" stroke="#e5e0d2"/><ellipse cx="0" cy="35" rx="10.5" ry="5" fill="#f4d6a0"/></g></g><g transform="translate(9,-36)"><g class="lg r"><rect x="-8" y="0" width="16" height="34" rx="5" fill="#fffdf8" stroke="#e5e0d2"/><ellipse cx="0" cy="35" rx="10.5" ry="5" fill="#f4d6a0"/></g></g>';
    if (staff) body =
      '<path d="M-20 -72 L20 -72 L28 -34 L-28 -34Z" fill="#1c2845"/><path d="M-7 -72 L-9 -34 M7 -72 L9 -34" stroke="#2c3b63" stroke-width="2"/><rect x="-20" y="-76" width="40" height="6" rx="2" fill="#141d35"/>' +
      '<path d="M-26 -101 Q0 -109 26 -101 L20 -72 L-20 -72Z" fill="#ffffff" stroke="#d3dae4" stroke-width="1.5"/><path d="M-9 -104 L0 -89 L9 -104 L3 -106 L0 -98 L-3 -106Z" fill="#eef2f7" stroke="#d3dae4"/>' +
      '<path d="M-6 -103 L0 -80 L6 -103" fill="none" stroke="#0b8a4a" stroke-width="2"/><rect x="-6.5" y="-82" width="13" height="16" rx="2" fill="#fff" stroke="#0b8a4a" stroke-width="1.5"/><rect x="-6.5" y="-82" width="13" height="5" rx="1.5" fill="#0b8a4a"/><rect x="-3.5" y="-72" width="7" height="2" fill="#9bb3a6"/>';
    else body =
      '<path d="M-18 -72 L-27 -26 L-35 -30 L-22 -74Z" fill="'+CL[1]+'"/><path d="M18 -72 L27 -26 L35 -30 L22 -74Z" fill="'+CL[1]+'"/>' +
      '<path d="M-26 -101 Q0 -109 26 -101 L19 -72 L26 -24 L-26 -24 L-19 -72Z" fill="'+CL[0]+'"/><path d="M-19 -72 L19 -72" stroke="'+CL[1]+'" stroke-width="2"/>' +
      '<g fill="'+CL[2]+'" opacity=".75"><circle cx="-9" cy="-92" r="2.6"/><circle cx="8" cy="-84" r="2.6"/><circle cx="-4" cy="-62" r="2.6"/><circle cx="10" cy="-48" r="2.6"/><circle cx="-12" cy="-40" r="2.6"/></g>' +
      '<rect x="-9" y="-109" width="18" height="8" rx="3" fill="'+CL[1]+'"/>';
    var arms = '<g transform="translate(-26,-98)"><g class="ar l"><rect x="-5" y="0" width="10" height="' + arm + '" rx="5" fill="' + sleeve + '" stroke="' + CL[1] + '" stroke-width="1"/>' + (staff ? '<rect x="-4" y="' + (arm - 6) + '" width="8" height="18" rx="4" fill="' + SKIN + '"/>' : '') + '<circle cx="0" cy="' + (arm + 12) + '" r="6" fill="' + SKIN + '"/></g></g>' +
      '<g transform="translate(26,-98)"><g class="ar r"><rect x="-5" y="0" width="10" height="' + arm + '" rx="5" fill="' + sleeve + '" stroke="' + CL[1] + '" stroke-width="1"/>' + (staff ? '<rect x="-4" y="' + (arm - 6) + '" width="8" height="18" rx="4" fill="' + SKIN + '"/>' : '') + '<circle cx="0" cy="' + (arm + 12) + '" r="6" fill="' + SKIN + '"/></g></g>';
    return '<g class="walk"><g transform="translate(150,314) scale(.82)"><ellipse cx="0" cy="3" rx="34" ry="7" fill="rgba(0,0,0,.2)"/><g class="bob">' + legs + body + arms + head(face) + '</g></g></g>';
  }

  var WING = '<g class="wing"><path d="M0 0 C-10 -26 -40 -36 -62 -18 C-52 -14 -55 -8 -46 -6 C-48 0 -40 5 -33 4 C-31 11 -20 11 -12 6Z" fill="url(#wf)" stroke="#bcd6ee" stroke-width="1.6"/><path d="M-14 -4 C-26 -14 -40 -18 -52 -14" fill="none" stroke="#cfe4f6" stroke-width="1.4"/></g>';
  function gift() { /* quà có cánh */
    var wing = WING;
    return '<g transform="translate(0,-86)"><g class="item"><g class="fl">' +
      '<circle class="halo" cx="0" cy="-2" r="52" fill="url(#hg)"/>' +
      '<g transform="translate(-14,-12)">' + wing + '</g><g transform="translate(14,-12) scale(-1,1)">' + wing + '</g>' +
      '<rect x="-17" y="-12" width="34" height="26" rx="3" fill="#ff7fab"/><rect x="-19" y="-21" width="38" height="11" rx="3" fill="#ff5c93"/><rect x="-3.5" y="-21" width="7" height="35" fill="#ffd35a"/>' +
      '<ellipse cx="-8" cy="-27" rx="8" ry="5.5" fill="#ffd35a" stroke="#e1ad2c"/><ellipse cx="8" cy="-27" rx="8" ry="5.5" fill="#ffd35a" stroke="#e1ad2c"/><circle cx="0" cy="-24" r="3.6" fill="#f2b92f"/></g>' +
      '<g fill="#fff7b0"><path class="sp" d="M-46 -34 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/><path class="sp" d="M44 -40 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/><path class="sp" d="M-30 10 l1.6 5 5 1.6 -5 1.6 -1.6 5 -1.6 -5 -5 -1.6 5 -1.6z"/><path class="sp" d="M34 8 l1.6 5 5 1.6 -5 1.6 -1.6 5 -1.6 -5 -5 -1.6 5 -1.6z"/><path class="sp" d="M0 -58 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/></g></g></g>';
  }

  function letter() { /* lá thư */
    return '<g transform="translate(0,-84)"><g class="item"><g class="fl">' +
      '<circle class="halo" cx="0" cy="0" r="50" fill="url(#hg)"/>' +
      '<g transform="translate(-24,-4)">' + WING + '</g><g transform="translate(24,-4) scale(-1,1)">' + WING + '</g>' +
      '<rect x="-24" y="-14" width="48" height="32" rx="3" fill="#fffaf0" stroke="#d9c79c" stroke-width="1.5"/><polygon points="-24,-14 24,-14 0,6" fill="#f5ead0" stroke="#d9c79c" stroke-width="1.5"/><circle cx="0" cy="4" r="6" fill="#d6244b"/><path d="M-2.6 4 l2.6 -3 l2.6 3 l-2.6 3z" fill="#ff8fa8"/>' +
      '</g><g fill="#fff7b0"><path class="sp" d="M-40 -26 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/><path class="sp" d="M38 -30 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z"/><path class="sp" d="M-28 20 l1.6 5 5 1.6 -5 1.6 -1.6 5 -1.6 -5 -5 -1.6 5 -1.6z"/><path class="sp" d="M30 22 l1.6 5 5 1.6 -5 1.6 -1.6 5 -1.6 -5 -5 -1.6 5 -1.6z"/></g></g></g>';
  }

  var DEFS = '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3f4"/><stop offset=".6" stop-color="#d7f1ee"/><stop offset="1" stop-color="#fff3d6"/></linearGradient>' +
    '<linearGradient id="bd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".5"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#0b8a4a" stop-opacity=".14"/></linearGradient>' +
    '<linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bfe6f3"/><stop offset=".5" stop-color="#7fb9cf"/><stop offset="1" stop-color="#a9d6e6"/></linearGradient>' +
    '<linearGradient id="gl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9edbe0"/><stop offset=".55" stop-color="#4e9aa2"/><stop offset="1" stop-color="#7cc3c9"/></linearGradient>' +
    '<linearGradient id="wf" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3f1ff"/></linearGradient>' +
    '<radialGradient id="hg"><stop offset="0" stop-color="#fff6b8" stop-opacity=".95"/><stop offset="1" stop-color="#ffd35a" stop-opacity="0"/></radialGradient></defs>';


  /* Âm thanh cảnh mở đầu: tiếng gió, chuông nhỏ lúc quà/thư vào tay, nhạc hộp nhẹ. Tổng hợp bằng WebAudio (không cần tệp, không vướng bản quyền).
     Trình duyệt chỉ cho phát tiếng sau khi người dùng chạm, nên bật khi chạm vào cảnh hoặc nút 🔊. */
  var Snd = (function () {
    var ctx = null, master = null, an = null, wg = null, wf = null, mg = null, on = false, step = 0, nextT = 0, tm = 0, windBuf = null, pref = "1";
    try { pref = localStorage.getItem("w20isnd") === "0" ? "0" : "1"; } catch (e) {}
    var BPM = 80, SP = 60 / BPM / 2; /* một nốt tám */
    /* nhạc hộp: Am – F – C – G, mỗi hợp âm 8 nốt, giai điệu thưa */
    var CH = [[220, 261.63, 329.63, 440, 329.63, 261.63, 329.63, 261.63], [174.61, 220, 261.63, 349.23, 261.63, 220, 261.63, 220], [196, 261.63, 329.63, 392, 329.63, 261.63, 329.63, 261.63], [196, 246.94, 293.66, 392, 293.66, 246.94, 293.66, 246.94]];
    var ML = [0, 0, 659.26, 0, 523.25, 0, 0, 0, 0, 0, 698.46, 0, 523.25, 0, 440, 0, 0, 0, 659.26, 0, 783.99, 0, 0, 0, 0, 587.33, 0, 493.88, 0, 392, 0, 0];
    function ac() { if (ctx) return ctx; var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = 0; an = ctx.createAnalyser(); an.fftSize = 512; master.connect(an); an.connect(ctx.destination);
      /* gió: nhiễu lọc dải, âm lượng lên xuống chậm */
      var n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), l = 0; for (var i = 0; i < n; i++) { l = l * .965 + (Math.random() * 2 - 1) * .035; d[i] = l * 9; } windBuf = b;
      mg = ctx.createGain(); mg.gain.value = 0; mg.connect(master);
      return ctx; }
    function startWind() { if (!ctx || wg) return; var s = ctx.createBufferSource(); s.buffer = windBuf; s.loop = true; wf = ctx.createBiquadFilter(); wf.type = "bandpass"; wf.Q.value = .9; wf.frequency.value = 520; wg = ctx.createGain(); wg.gain.value = 0; s.connect(wf); wf.connect(wg); wg.connect(master); s.start();
      var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .42; lg.gain.value = 260; lfo.connect(lg); lg.connect(wf.frequency); lfo.start(); }
    function windLevel(v, sec) { if (ctx && wg) wg.gain.setTargetAtTime(v, ctx.currentTime, sec || .6); }
    function note(f, t, vol, dur) { var o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(); o.type = "triangle"; o2.type = "sine"; o.frequency.value = f; o2.frequency.value = f * 2.001; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + (dur || 1.6)); var g2 = ctx.createGain(); g2.gain.value = .22; o.connect(g); o2.connect(g2); g2.connect(g); g.connect(mg); o.start(t); o2.start(t); o.stop(t + (dur || 1.6) + .05); o2.stop(t + (dur || 1.6) + .05); }
    function sched() { if (!on || !ctx) return; while (nextT < ctx.currentTime + .9) { var c = CH[Math.floor(step / 8) % 4], k = step % 8, m = ML[step % ML.length]; note(c[k], nextT, k === 0 ? .17 : .1, 1.5); if (k === 0) note(c[0] / 2, nextT, .1, 2.4); if (m) note(m, nextT, .1, 1.8); step++; nextT += SP; } }
    function music(v) { if (mg) mg.gain.setTargetAtTime(v, ctx.currentTime, .8); }
    function chime(t0) { if (!ctx) return; var t = (t0 || ctx.currentTime) + .02; [783.99, 987.77, 1318.51, 1567.98].forEach(function (f, i) { note(f, t + i * .11, .12, 1.4); }); }
    function rustle() { if (!ctx || !windBuf) return; var s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter(); s.buffer = windBuf; f.type = "highpass"; f.frequency.value = 2600; g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(.35, ctx.currentTime + .05); g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .5); s.connect(f); f.connect(g); g.connect(master); s.start(); s.stop(ctx.currentTime + .6); }
    return {
      muted: function () { return pref === "0"; }, on: function () { return on; },
      /* gọi khi người dùng chạm: tạo/ tiếp tục ngữ cảnh âm thanh */
      enable: function (phase) {
        if (pref === "0" || on) return on; if (!ac()) return false; try { if (ctx.state === "suspended") ctx.resume(); } catch (e) {}
        on = true; master.gain.cancelScheduledValues(0); master.gain.setTargetAtTime(.9, ctx.currentTime, .3); startWind(); nextT = ctx.currentTime + .1; step = 0; sched(); tm = setInterval(sched, 250);
        music(.6); windLevel(phase === "ready" ? 0 : phase === "drop" ? .22 : .13, .5); return true; },
      mute: function () { pref = "0"; try { localStorage.setItem("w20isnd", "0"); } catch (e) {} Snd.stop(true); },
      unmute: function (phase) { pref = "1"; try { localStorage.setItem("w20isnd", "1"); } catch (e) {} return Snd.enable(phase); },
      phase: function (p) { if (!on) return; if (p === "walk") windLevel(.13, .5); else if (p === "drop") windLevel(.24, .5); else if (p === "ready") { windLevel(0, .9); chime(); music(.55); } else if (p === "open") { rustle(); chime(); music(0); windLevel(0, .3); } },
      stop: function (quick) { if (!ctx) return; on = false; clearInterval(tm); try { master.gain.setTargetAtTime(0, ctx.currentTime, quick ? .12 : .5); } catch (e) {} },
      close: function () { Snd.stop(); setTimeout(function () { try { ctx && ctx.close(); } catch (e) {} ctx = null; wg = null; }, 1600); },
      analyser: function () { return an; }
    };
  })();

  function mount(host, o) {
    css(); o = o || {}; var kind = o.kind === "sep" ? "sep" : "staff", T = [], state = "idle", opened = false;
    var box = document.createElement("div"); box.className = "w20i"; box.setAttribute("role", "button"); box.setAttribute("tabindex", "0");
    box.setAttribute("aria-label", kind === "sep" ? "Lá thư có cánh rơi xuống tay Sếp, chạm để đọc" : "Một món quà bất ngờ rơi xuống tay, chạm để mở");
    var face = o.face || "";
    box.innerHTML = '<svg viewBox="0 0 400 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">' + DEFS + building() +
      '<g transform="translate(0,0)">' + chibi(kind, face, o.id) + '</g>' + windSvg() + '</svg><div class="ltr"></div><button type="button" class="snd off" aria-label="Bật hoặc tắt âm thanh">🔇 Chạm để bật âm thanh</button>';
    host.innerHTML = ""; host.appendChild(box);
    var svg = box.querySelector("svg"), chg = svg.querySelector(".walk > g > .bob");
    var holder = document.createElementNS("http://www.w3.org/2000/svg", "g"); holder.setAttribute("transform", "translate(150,314) scale(.82)"); holder.innerHTML = kind === "sep" ? letter() : gift(); svg.appendChild(holder);
    if (face && o.fb) { var im = new Image(); im.onerror = function () { var h = svg.querySelector("image.hd"); if (h) h.setAttribute("href", o.fb); }; im.src = face; }
    if (o.hint && o.keepClass) { var hs = o.hint.style; hs.minHeight = "2.55em"; hs.display = "flex"; hs.flexDirection = "column"; hs.justifyContent = "flex-end"; hs.alignItems = "center"; } /* giữ chỗ 2 dòng để tranh không nhảy */
    function hint(t) { if (o.hint) { if (!o.keepClass) o.hint.className = "tapme"; o.hint.innerHTML = t; if (!o.keepClass) o.hint.style.display = ""; } }
    function at(ms, f) { T.push(setTimeout(f, ms)); }
    function setReady() { var was = state; state = "ready"; Snd.phase("ready"); box.classList.add("drop", "arr", "hold", "ready"); hint(kind === "sep" ? "Một lá thư bất ngờ rơi xuống! Chạm để đọc ✉️" : "Một món quà bất ngờ rơi xuống! Chạm để mở 🎁"); }
    function run() {
      if (RM) { box.classList.add("go", "skip"); setReady(); return; }
      state = "walk"; hint("Đang đến cơ quan…"); box.classList.add("go");
      at(WALK, function () { box.classList.add("arr"); });
      at(WALK + 250, function () { state = "drop"; box.classList.add("drop", "hold"); hint(kind === "sep" ? "Một lá thư bất ngờ rơi xuống… ✉️" : "Một món quà bất ngờ rơi xuống… ✨"); Snd.phase("drop"); });
      at(WALK + 250 + DROP, setReady);
    }
    function skip() { T.forEach(clearTimeout); T = []; box.classList.add("skip", "go", "arr", "drop", "hold"); setReady(); setTimeout(function () { box.classList.remove("skip"); }, 60); }
    function open() {
      if (opened) return; opened = true; state = "open"; box.classList.add("open"); Snd.phase("open"); setTimeout(Snd.close, 1200);
      if (kind === "sep") { hint("Đang mở thư… ✉️"); at(750, function () { o.onOpen && o.onOpen(); }); /* thư bung ra rồi vào thẳng tờ trình */
      } else { at(380, function () { o.onOpen && o.onOpen(); }); }
    }
    function tap() { if (state === "walk" || state === "drop" || state === "idle") { skip(); return; } if (state === "ready") open(); }
    var sb = box.querySelector(".snd");
    function sbRefresh() { var on = Snd.on(); sb.className = "snd" + (on ? "" : " off"); sb.textContent = on ? "🔊 Âm thanh" : (Snd.muted() ? "🔇 Âm thanh: Tắt" : "🔇 Chạm để bật âm thanh"); }
    sb.addEventListener("click", function (e) { e.stopPropagation(); if (Snd.on()) Snd.mute(); else Snd.unmute(state); sbRefresh(); });
    box.addEventListener("pointerdown", function (e) { if (e.target === sb) return; if (!Snd.on() && !Snd.muted() && !opened) { Snd.enable(state); sbRefresh(); } }, true);
    sbRefresh();
    box.addEventListener("click", tap);
    box.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } });
    run();
    return { skip: skip, analyser: Snd.analyser, destroy: function () { T.forEach(clearTimeout); Snd.stop(true); try { box.remove(); } catch (e) {} } };
  }
  return { mount: mount, ver: V };
})();

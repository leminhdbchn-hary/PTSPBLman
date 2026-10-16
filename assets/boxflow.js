/* Bộ máy "hộp quà lồng nhau": mỗi bước là một lớp mở ra, hộp càng về sau càng nhỏ.
   W20Flow.make({ N, stage: "#stage", scene: function (i) {...}, onReveal: function (i) {...} }) → { show, unbox, boxHTML, cur } */
var W20Flow = (function () {
  var LAY = [["#c2185b", "#8e0f45", "#e8458a"], ["#c9971c", "#8a6410", "#f0c75a"], ["#2f8f5b", "#1b5e3a", "#58c28a"], ["#d46a92", "#9c3a60", "#f09ab9"], ["#a8742a", "#6f4a14", "#d9a850"], ["#b3265f", "#7a1440", "#dc5a8a"], ["#e08aa8", "#a85575", "#f6b6cb"], ["#7b4fa3", "#4f2e75", "#a982d0"]];
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  function make(o) {
    var N = o.N, cur = -1;
    function L(i) { return LAY[Math.max(0, i) % LAY.length]; }
    function boxW(i) { var big = innerWidth >= 900, base = big ? 400 : 280, step = big ? 34 : 24; return Math.round(Math.max(110, Math.min(base - i * step, innerWidth * .7, innerHeight * .46))); }
    function boxHTML(i) { var c = L(i); return '<div class="gb" style="--w:' + boxW(i) + 'px;--c:' + c[0] + ";--c2:" + c[1] + ";--c3:" + c[2] + '"><div class="gb-body"></div><div class="gb-lid"><span class="gb-bow">🎀</span></div></div>'; }
    function frame(i) { var c = L(i), el = o.scene(i); el.style.setProperty("--c", c[0]); el.style.setProperty("--c3", c[2]); el.style.setProperty("--i", i); }
    function reveal(i) {
      [].forEach.call(document.querySelectorAll(".scene"), function (x) { x.classList.remove("on", "leave"); });
      document.body.classList.toggle("fin", i === N - 1); document.body.classList.toggle("wh", o.wheel != null && i === o.wheel); /* màn cuối (thiệp) không nằm trong hộp quà nữa */
      if (i >= 0) frame(i); var el = o.scene(i); el.classList.add("on"); cur = i;
      var pb = el.querySelector(".pbody"); if (pb) pb.scrollTop = 0;
      o.onReveal && o.onReveal(i);
    }
    function unbox(i, cb) {
      var st = document.querySelector(o.stage), ub = document.createElement("div"); ub.className = "ub"; ub.innerHTML = boxHTML(i); st.appendChild(ub);
      var prev = o.scene(cur); if (prev) prev.classList.add("leave");
      requestAnimationFrame(function () { ub.classList.add("in"); });
      setTimeout(function () { ub.querySelector(".gb").classList.add("open"); FX.burst(innerWidth / 2, innerHeight * .45, 60); if (navigator.vibrate) navigator.vibrate(25); }, 700);
      setTimeout(function () { reveal(i); ub.classList.add("out"); }, 1450);
      setTimeout(function () { ub.remove(); cb && cb(); }, 2050);
    }
    var busy = false;
    function show(i, anim) { if (busy || i === cur) return; if (!anim || reduce) { reveal(i); return; } busy = true; unbox(i, function () { busy = false; }); }
    return { show: show, unbox: unbox, boxHTML: boxHTML, reveal: reveal, cur: function () { return cur; }, N: N };
  }
  return { make: make };
})();

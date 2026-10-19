/* Lưu dữ liệu lên Firebase (Cloud Firestore). Nếu Firebase lỗi hoặc bị chặn, trang vẫn chạy bình thường (chỉ lưu trên máy). */
var W20DB = (function () {
  var CFG = {
    apiKey: "AIzaSyC9fVcxYdVVJ_fjJWJM963in4T4M89EeGQ",
    authDomain: "ptspbl-man-2010.firebaseapp.com",
    projectId: "ptspbl-man-2010",
    storageBucket: "ptspbl-man-2010.firebasestorage.app",
    messagingSenderId: "703449466616",
    appId: "1:703449466616:web:9ba7b3b655558814e8dd0d"
  };
  var V = "10.14.1", BASE = "https://www.gstatic.com/firebasejs/" + V + "/";
  var db = null, q = [], loading = false, timers = {};
  function js(src, cb) { var s = document.createElement("script"); s.src = src; s.async = true; s.onload = cb; s.onerror = function () {}; document.head.appendChild(s); }
  function ready(fn) {
    if (db) return fn();
    q.push(fn);
    if (loading) return; loading = true;
    js(BASE + "firebase-app-compat.js", function () {
      js(BASE + "firebase-firestore-compat.js", function () {
        try { firebase.initializeApp(CFG); db = firebase.firestore(); q.splice(0).forEach(function (f) { f(); }); } catch (e) {}
      });
    });
  }
  function clean(o) { try { return JSON.parse(JSON.stringify(o)); } catch (e) { return {}; } }
  function dev() { try { var d = localStorage.getItem("w20dev"); if (!d) { d = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); localStorage.setItem("w20dev", d); } return d; } catch (e) { return "nodev"; } }
  function key(k) { return String(k).replace(/[^\w\-:]/g, "_").slice(0, 100); }
  /* Gộp 2 bản tiến độ: bản nào đi xa hơn thì thắng, không bao giờ lùi lại (không cho mở lại / quay lại quà) */
  function merge(a, b) {
    a = a || {}; b = b || {};
    var hi = (b.step || 0) > (a.step || 0) ? b : a, lo = hi === a ? b : a, o = {}, k;
    for (k in lo) o[k] = lo[k];
    for (k in hi) o[k] = hi[k];
    ["prizes", "notes", "bq"].forEach(function (f) { var x = a[f] || [], y = b[f] || []; if (x.length || y.length) o[f] = y.length > x.length ? y : x; });
    o.step = Math.max(a.step || 0, b.step || 0); o.pulls = Math.max(a.pulls || 0, b.pulls || 0); if (a.scratched || b.scratched) o.scratched = 1;
    return o;
  }
  return {
    merge: merge,
    /* Đọc tiến độ đã lưu trên server (tối đa 4 giây; lỗi/chặn mạng thì gọi cb(null) để trang vẫn chạy) */
    load: function (id, cb) {
      var fin = false, t = setTimeout(function () { end(null); }, 4000);
      function end(v) { if (fin) return; fin = true; clearTimeout(t); try { cb(v); } catch (e) {} }
      ready(function () { db.collection("progress").doc(key(id + "@" + dev())).get().then(function (d) { end(d.exists ? (d.data() || {}).data || null : null); }, function () { end(null); }); });
    },
    /* Lưu tiến độ của từng người (gộp, ghi trễ 1,5 giây để đỡ ghi nhiều) */
    progress: function (id, data) {
      clearTimeout(timers[id]);
      timers[id] = setTimeout(function () {
        ready(function () {
          var ref = db.collection("progress").doc(key(id + "@" + dev()));
          /* đọc bản trên server rồi gộp, tránh máy mới/ngoại tuyến ghi đè mất tiến độ cũ */
          ref.get().then(function (d) { var rv = d.exists ? (d.data() || {}).data : null; return ref.set({ pid: String(id), data: clean(merge(rv, clean(data))), updated: firebase.firestore.FieldValue.serverTimestamp() }); }, function () { return ref.set({ pid: String(id), data: clean(data), updated: firebase.firestore.FieldValue.serverTimestamp() }); }).catch(function () {});
        });
      }, 1500);
    },
    /* Khôi phục tiến độ gần nhất của cùng một người (cùng link) ghi trong maxAgeMs gần đây: dùng khi người chơi mở link ở trình duyệt khác trên cùng điện thoại
       (VD đang chơi trong Zalo rồi chuyển sang Safari). Lỗi/chặn mạng/quá 4 giây thì gọi cb(null). */
    restore: function (id, maxAgeMs, cb) {
      var fin = false, t = setTimeout(function () { end(null); }, 4000);
      function end(v) { if (fin) return; fin = true; clearTimeout(t); try { cb(v); } catch (e) {} }
      ready(function () {
        db.collection("progress").where("pid", "==", String(id)).get().then(function (snap) {
          var best = null; snap.forEach(function (d) { var v = d.data() || {}, tm = v.updated && v.updated.toMillis ? v.updated.toMillis() : Date.now(); if (!best || tm > best.t) best = { t: tm, data: v.data }; });
          end(best && Date.now() - best.t < maxAgeMs ? best.data : null);
        }, function () { end(null); });
      });
    },
    /* Theo dõi trực tiếp một collection (cho trang quản lý): cb(rows) mỗi khi có thay đổi, err(lỗi) nếu bị chặn */
    watch: function (col, cb, err) {
      ready(function () {
        try { db.collection(col).onSnapshot(function (snap) { var rows = []; snap.forEach(function (d) { var v = d.data() || {}; v.__id = d.id; rows.push(v); }); cb(rows); }, function (e) { err && err(e); }); }
        catch (e) { err && err(e); }
      });
    },
    /* Cấu hình số lượng quà ở vòng quay (settings/stock): { qty, seed, map:{id: món}, at }. cb(null) nếu lỗi/quá 4 giây */
    getStock: function (cb) {
      var fin = false, t = setTimeout(function () { end(null); }, 4000);
      function end(v) { if (fin) return; fin = true; clearTimeout(t); try { cb(v); } catch (e) {} }
      ready(function () { db.collection("settings").doc("stock").get().then(function (d) { end(d.exists ? d.data() : null); }, function () { end(null); }); });
    },
    setStock: function (o, ok, fail) {
      ready(function () { db.collection("settings").doc("stock").set({ qty: o.qty, seed: String(o.seed), map: o.map, at: firebase.firestore.FieldValue.serverTimestamp() }).then(function () { ok && ok(); }, function (e) { fail && fail(e); }); });
    },
    /* Lưu “Thẻ nhờ việc” để anh em xem tập trung */
    request: function (id, who, text) {
      ready(function () { db.collection("requests").add({ id: key(id), who: String(who).slice(0, 100), text: String(text).slice(0, 300), at: firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {}); });
    }
  };
})();

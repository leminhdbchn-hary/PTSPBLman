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
  function key(k) { return String(k).replace(/[^\w\-:]/g, "_").slice(0, 100); }
  return {
    /* Lưu tiến độ của từng người (gộp, ghi trễ 1,5 giây để đỡ ghi nhiều) */
    progress: function (id, data) {
      clearTimeout(timers[id]);
      timers[id] = setTimeout(function () {
        ready(function () { db.collection("progress").doc(key(id)).set({ data: clean(data), updated: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }).catch(function () {}); });
      }, 1500);
    },
    /* Lưu “Thẻ nhờ việc” để anh em xem tập trung */
    request: function (id, who, text) {
      ready(function () { db.collection("requests").add({ id: key(id), who: String(who).slice(0, 100), text: String(text).slice(0, 300), at: firebase.firestore.FieldValue.serverTimestamp() }).catch(function () {}); });
    }
  };
})();

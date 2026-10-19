/* Danh sách chị em Phòng PTSPBL (chỉ tên và chức vụ).
   id = mã riêng trong link; x = xưng hô (mặc định Chị; sinh từ 1995 là Em); lead = lãnh đạo phòng; bd = sinh nhật tháng 10 (để chúc thêm).
   Thêm / bớt người: thêm một dòng mới với id khác nhau (6 ký tự). */
var W20P = [
  {"id": "f513a5", "n": "Trần Thị Hạnh", "t": "Trưởng Phòng PTSPBL", "lead": 1},
  {"id": "4b936d", "n": "Bùi Thị Thu Thủy", "t": "Phó trưởng Phòng PTSPBL", "lead": 1},
  {"id": "ac7d8d", "n": "Đỗ Thị Tố Quyên", "t": "Phó trưởng Phòng PTSPBL", "lead": 1},
  {"id": "c75a35", "n": "Đặng Thị Huyền", "t": "Phó trưởng Phòng PTSPBL", "lead": 1},
  {"id": "5ad49a", "n": "Ninh Thị Hoài Phương", "t": "Phó trưởng Phòng PTSPBL", "lead": 1},
  {"id": "ab0777", "n": "Nguyễn Hồng Thanh", "t": "Phó trưởng Phòng PTSPBL", "lead": 1},
  {"id": "533d4c", "n": "Đoàn Anh Thư", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "e97542", "n": "Nguyễn Thị Thanh", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "683207", "n": "Vũ Thị Hà Phương", "t": "Chuyên viên Phòng PTSPBL", "x": "Em"},
  {"id": "761c47", "n": "Lê Lan Phương", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "d9bb15", "n": "Hà Thị Tuyết Hạnh", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "7040ce", "n": "Trần Thị Vân Anh", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "418150", "n": "Hà Thị Hải Ninh", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "815693", "n": "Nguyễn Thu Hương", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "df44fb", "n": "Đỗ Minh Phương", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "ec27bc", "n": "Đặng Thị Thanh Huyền", "t": "Chuyên viên Phòng PTSPBL", "bd": 1},
  {"id": "a80606", "n": "Nông Thị Quỳnh Anh", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "fb96c5", "n": "Nguyễn Bích Ngọc", "t": "Chuyên viên Phòng PTSPBL", "bd": 1},
  {"id": "39b902", "n": "Phạm Hồng Trang", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "dc615b", "n": "Trần Thị Thu Thảo", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "e04324", "n": "Nguyễn Thị Như Trang", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "f1f1a3", "n": "Lê Thị Thu Hà", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "d5e174", "n": "Phạm Thị Thu Nga", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "bb2a0e", "n": "Đỗ Thị Hiền Thương", "t": "Chuyên viên Phòng PTSPBL", "bd": 1},
  {"id": "d61d24", "n": "Phạm Thị Lan Hương", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "bc5f90", "n": "Phạm Thị Thanh Loan", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "b6cfae", "n": "Nguyễn Thị Vân Anh", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "bf09ec", "n": "Nguyễn Chính Thắng", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "3e5f12", "n": "Thạch Thị Huyền", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "aae83c", "n": "Đoàn Mai Anh", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "6f5c9f", "n": "Nguyễn Minh Ngọc", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "5f5ed4", "n": "Lê Thu Hiền", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "e722db", "n": "Nguyễn Tú Anh", "t": "Chuyên viên Phòng PTSPBL", "x": "Em"},
  {"id": "ee895a", "n": "Vũ Thu Huyền Mi", "t": "Chuyên viên Phòng PTSPBL", "bd": 1},
  {"id": "d7dcca", "n": "Đào Thị Kim Ngọc", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "8584e8", "n": "Hoàng Hồng Hà", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "5fccc2", "n": "Đinh Thu Trang", "t": "Chuyên viên Phòng PTSPBL", "bd": 1},
  {"id": "917f80", "n": "Nguyễn Thùy Dương", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "fb1654", "n": "Nguyễn Vũ Phương Linh", "t": "Chuyên viên Phòng PTSPBL", "x": "Em"},
  {"id": "6d93ba", "n": "Chu Lê Mỹ Nga", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "3a116f", "n": "Viên Ngọc Bích", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "334f8f", "n": "Vũ Thị Thu Huyền", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "ebd8b5", "n": "Lê Kim Dung", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "552053", "n": "Nguyễn Thị Hà Châu", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "e1bcd9", "n": "Nguyễn Thị Vân Anh", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "a9dadf", "n": "Nguyễn Thu Huyền", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "4d50b3", "n": "Phạm Thị Linh", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "5d4d57", "n": "Nguyễn Mỹ Linh", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "d80a9c", "n": "Mai Thanh Thùy Linh", "t": "Chuyên viên Phòng PTSPBL", "x": "Em"},
  {"id": "e0bd72", "n": "Trần Thái Phương", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "bae0d6", "n": "Nguyễn Thị Thu Trang", "t": "Chuyên viên Phòng PTSPBL"},
  {"id": "15c819", "n": "Nguyễn Thị Ngân Giang", "t": "Chuyên viên Phòng PTSPBL", "x": "Em"},
  {"id": "3a6025", "n": "Phạm Thu Trang", "t": "Chuyên viên Phòng PTSPBL"}
];

/* 2 link thử (1 nhân viên nữ, 1 lãnh đạo phòng nữ): mở đi mở lại được, KHÔNG lưu tiến độ, KHÔNG tính vào chia quà/thống kê.
   Link: index.html?u=test01 (nhân viên nữ) và index.html?u=test02 (lãnh đạo phòng nữ) (test02 tự chuyển sang trang Sếp) */
var W20TEST = [
  {"id": "test01", "n": "Nguyễn Test An", "t": "Chuyên viên Phòng PTSPBL", "x": "Chị", "test": 1},
  {"id": "test02", "n": "Trần Test Bình", "t": "Phó trưởng Phòng PTSPBL", "x": "Chị", "test": 1, "lead": 1}
];

/* Đăng nhập bằng email: mỗi người điền email (phần trước @, vd thuda.ho) ở link chung, web tự mở đúng trang của người đó.
   Chỉ lưu dấu băm (SHA-256) của email, không để lộ email thật trong mã nguồn. */
var W20MAIL = {
 "53747dfcc01c8c46": "3a6025",
 "5f0bd5e3480f4f81": "f513a5",
 "e2bed3c1dee272e9": "533d4c",
 "8484d29a41edd8de": "e97542",
 "2b36ddde0b391f11": "683207",
 "5946676e625e01eb": "4b936d",
 "773c5815a1ccade7": "761c47",
 "ade50af7080ee9a2": "d9bb15",
 "ec90db0a32ccee49": "7040ce",
 "8161567fb9206140": "418150",
 "bf9360d38a404786": "815693",
 "ed68bc8446a899af": "df44fb",
 "38cd0d6d579126ec": "ec27bc",
 "b6abdbe4deeb0295": "ac7d8d",
 "29bc281d9cdfc46e": "a80606",
 "526f9c6cdad89228": "fb96c5",
 "2602a3e355754bd8": "39b902",
 "226e2e3b5cae3c05": "dc615b",
 "9ebb1a80f992abe4": "e04324",
 "9d042928c1cf7220": "f1f1a3",
 "b07df073d28f730d": "d5e174",
 "de9445c8ac561952": "bb2a0e",
 "7d4c12085bb21e0c": "d61d24",
 "39fce2f6f374c05b": "c75a35",
 "d38c0a6a1e9527e1": "bc5f90",
 "1e65f2861c805bc2": "b6cfae",
 "8bc33ba72d9495d3": "bf09ec",
 "96b735f1fa536286": "3e5f12",
 "f0b95d6fa75f33a9": "aae83c",
 "14795025bb317dc4": "6f5c9f",
 "a62b1306e21c0f56": "5f5ed4",
 "182b67f0f5d7552b": "e722db",
 "548bfacceb3a5671": "5ad49a",
 "8ea6649e1920fb73": "ee895a",
 "671e7cb10761ea61": "d7dcca",
 "d364f4050ee7c39b": "8584e8",
 "1ebe905f36f7f322": "5fccc2",
 "7630f2e0cb0ab66e": "917f80",
 "c5039d87db6b2bdf": "fb1654",
 "be934b4c704d8bed": "6d93ba",
 "631403492a85415f": "ab0777",
 "8b7c15b397625754": "3a116f",
 "2a03deb0c7b8c352": "334f8f",
 "00edc277dc095e2b": "ebd8b5",
 "c67c18024d24ad6b": "552053",
 "e6e66cfacd7f8859": "e1bcd9",
 "a710ea7f105f3837": "a9dadf",
 "dcdbcba2cde05626": "4d50b3",
 "f54c537fc92efe73": "5d4d57",
 "cbf056cd34127766": "d80a9c",
 "4775778873ddd719": "e0bd72",
 "1b7e6554cf65fe11": "bae0d6",
 "d11d9aa3b93cfaea": "15c819"
};
function w20Sha(s) {
  var K = [], i, j, p = 2, isP;
  for (i = 0; K.length < 64; p++) { isP = true; for (j = 2; j * j <= p; j++) if (p % j === 0) { isP = false; break; } if (isP) K.push((Math.pow(p, 1 / 3) % 1) * 4294967296 | 0); }
  var H = [], q = 2; for (i = 0; H.length < 8; q++) { isP = true; for (j = 2; j * j <= q; j++) if (q % j === 0) { isP = false; break; } if (isP) H.push((Math.pow(q, .5) % 1) * 4294967296 | 0); }
  var b = unescape(encodeURIComponent(s)), L = b.length, w = [], nw = (((L + 8) >> 6) + 1) * 16; for (i = 0; i < nw; i++) w.push(0);
  for (i = 0; i < L; i++) w[i >> 2] |= b.charCodeAt(i) << (24 - (i % 4) * 8);
  w[L >> 2] |= 0x80 << (24 - (L % 4) * 8); w[(((L + 8) >> 6) + 1) * 16 - 1] = L * 8;
  function R(x, n) { return (x >>> n) | (x << (32 - n)); }
  for (var o = 0; o < w.length; o += 16) {
    var W = w.slice(o, o + 16), a = H.slice(), t;
    for (i = 16; i < 64; i++) { var s0 = R(W[i - 15], 7) ^ R(W[i - 15], 18) ^ (W[i - 15] >>> 3), s1 = R(W[i - 2], 17) ^ R(W[i - 2], 19) ^ (W[i - 2] >>> 10); W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0; }
    for (i = 0; i < 64; i++) {
      var S1 = R(a[4], 6) ^ R(a[4], 11) ^ R(a[4], 25), ch = (a[4] & a[5]) ^ (~a[4] & a[6]), t1 = (a[7] + S1 + ch + K[i] + W[i]) | 0, S0 = R(a[0], 2) ^ R(a[0], 13) ^ R(a[0], 22), mj = (a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]), t2 = (S0 + mj) | 0;
      a = [(t1 + t2) | 0, a[0], a[1], a[2], (a[3] + t1) | 0, a[4], a[5], a[6]];
    }
    for (i = 0; i < 8; i++) H[i] = (H[i] + a[i]) | 0;
  }
  return H.map(function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
}
function w20ByEmail(txt) {
  var e = String(txt || "").toLowerCase().replace(/\s+/g, "").split("@")[0].replace(/[^a-z0-9._-]/g, ""); if (!e) return null;
  var tt = e.replace(/\.ho\d*$/, ""); if (tt === "test01" || tt === "test02") return tt; /* email thử */
  var id = W20MAIL[w20Sha("ptspbl:" + e).slice(0, 16)] || (!/\.ho\d*$/.test(e) && W20MAIL[w20Sha("ptspbl:" + e + ".ho").slice(0, 16)]);
  return id || null;
}

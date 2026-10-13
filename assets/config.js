/* ====== CẤU HÌNH DO NGƯỜI TỔ CHỨC CHỈNH (sửa file này là đủ) ====== */
var W20CFG = {
  /* Dòng ký tên cuối thiệp */
  from: "Anh em Phòng PTSPBL",

  /* Mã PIN để mở trang quản lý (admin.html): danh sách link + thống kê quà */
  adminPin: "2010",

  /* Các anh chạy ra tặng hoa ở phần Cắm hoa (ảnh đầu đã cắt sẵn trong assets/men).
     Thêm người: bỏ ảnh h8.webp… vào assets/men rồi thêm một dòng ở đây. shirt = màu áo (trắng "#ffffff", đen "#1d1f2a"). */
  men: [
    { img: "assets/men/h1.webp", shirt: "#ffffff" },
    { img: "assets/men/h2.webp", shirt: "#1d1f2a" },
    { img: "assets/men/h3.webp", shirt: "#ffffff" },
    { img: "assets/men/h4.webp", shirt: "#ffffff" },
    { img: "assets/men/h5.webp", shirt: "#ffffff" },
    { img: "assets/men/h6.webp", shirt: "#ffffff" },
    { img: "assets/men/h7.webp", shirt: "#ffffff" },
    { img: "assets/men/h8.webp", shirt: "#ffffff" },
    { img: "assets/men/h9.webp", shirt: "#ffffff" },
    { img: "assets/men/h10.webp", shirt: "#ffffff" }
  ],

  /* Quà ở Vòng quay (thứ tự này phải khớp với số lượng trong assets/stock.js).
     Mỗi chị em quay 2 lượt và nhận 2 món KHÁC NHAU, ngẫu nhiên và không ai chọn sẵn.
     Số lượng từng món chỉnh ở trang admin.html (tab "Chia quà"). key "nho" = thẻ nhờ việc. */
  prizes: [
    { icon: "🍫", name: "1 gói KitKat" },
    { icon: "☕", name: "1 ly cà phê / trà sữa anh em đãi" },
    { icon: "🙋", name: "Nhờ anh em giúp 1 việc vặt", key: "nho" },
    { icon: "🎁", name: "1 món quà nhỏ" }
  ],

  /* (Không bắt buộc) Nhận "Thẻ nhờ việc" qua Google Form để anh em xem tập trung trong Google Sheet.
     Cách lấy: tạo Form có 1 câu hỏi dạng đoạn văn → ⋮ → "Nhận đường liên kết điền sẵn" → điền chữ "x" → lấy link.
     url: phần trước dấu ?   |   field: phần "entry.xxxxx" của câu hỏi.  Để trống thì nút Gửi sẽ sao chép lời nhờ để dán vào nhóm chat. */
  requestForm: { url: "", field: "" },

  /* Lời nhắn của anh em trên "Tường lời chúc". Thay các câu mẫu bằng lời thật nhé. */
  wallSep: [
    { from: "Một đồng nghiệp nam", text: "Cảm ơn Sếp đã kiên nhẫn với những lần anh em xin thêm 15 phút nữa Ạ." },
    { from: "Một đồng nghiệp nam", text: "Chúc Sếp thật nhiều sức khỏe để còn “góp ý” cho anh em" },
    { from: "Một đồng nghiệp nam", text: "Chúc Sếp tờ trình nào cũng duyệt ngay vòng đầu, cả chiều đi lẫn chiều về." }
  ],
  wallChiEm: [
    { from: "Một đồng nghiệp nam", text: "Chúc các chị em 20/10 không có việc gì gấp, trừ việc ăn bánh, uống trà và nhận quà." },
    { from: "Một đồng nghiệp nam", text: "Hôm nay anh em xin nhận KPI đặc biệt: chủ động pha trà, mua bánh, tặng hoa và tuyệt đối không giao thêm việc." },
    { from: "Một đồng nghiệp nam", text: "Anh em cam kết hôm nay không hỏi “việc này làm thế nào?”, không nhờ “Sửa giúp anh/em tí”." },
    { from: "Một đồng nghiệp nam", text: "Chúc các chị em trình phương án nào cũng thuận lợi, chính sách nào cũng thông suốt, góp ý nào cũng dễ tiếp thu và việc nào cũng về đích đúng hạn!" }
  ]
};

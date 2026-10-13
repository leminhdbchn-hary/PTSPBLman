/* ====== CẤU HÌNH DO NGƯỜI TỔ CHỨC CHỈNH (sửa file này là đủ) ====== */
var W20CFG = {
  /* Dòng ký tên cuối thiệp */
  from: "Anh em Nam Phòng PTSPBL",

  /* Mã PIN để mở trang quản lý (admin.html): danh sách link + thống kê quà */
  adminPin: "2010",

  /* Quà ở Vòng quay. qty = số lượng món đó. Mỗi chị em được chia sẵn 1 món theo số lượng này,
     quay ở đâu cũng ra đúng món đó (mỗi người chỉ quay 1 lần).
     Bỏ trống qty (hoặc tổng nhỏ hơn số người) thì phần còn thiếu được chia đều.
     key "nho" = thẻ nhờ việc: người nhận được ghi việc muốn nhờ. */
  prizes: [
    { icon: "☕", name: "1 cốc cà phê / trà sữa anh em đãi", qty: 0 },
    { icon: "🍰", name: "1 phần bánh ngọt chiều nay", qty: 0 },
    { icon: "🌸", name: "1 bó hoa nhỏ để bàn", qty: 0 },
    { icon: "🍫", name: "1 hộp sô-cô-la", qty: 0 },
    { icon: "🙋", name: "Thẻ nhờ anh em 1 việc bất kỳ", qty: 0, key: "nho" },
    { icon: "🎁", name: "Quà bí mật, nhận tại buổi gặp mặt", qty: 0 }
  ],
  /* Đổi chữ này nếu muốn xáo lại cách chia quà (chỉ đổi TRƯỚC khi gửi link) */
  seed: "2010",

  /* (Không bắt buộc) Nhận "Thẻ nhờ việc" qua Google Form để anh em xem tập trung trong Google Sheet.
     Cách lấy: tạo Form có 1 câu hỏi dạng đoạn văn → ⋮ → "Nhận đường liên kết điền sẵn" → điền chữ "x" → lấy link.
     url: phần trước dấu ?   |   field: phần "entry.xxxxx" của câu hỏi.  Để trống thì nút Gửi sẽ sao chép lời nhờ để dán vào nhóm chat. */
  requestForm: { url: "", field: "" },

  /* Lời nhắn của anh em trên "Tường lời chúc". Thay các câu mẫu bằng lời thật nhé. */
  wallSep: [
    { from: "Một đồng nghiệp nam", text: "Cảm ơn Sếp đã kiên nhẫn với những lần anh em xin thêm 5 phút nữa." },
    { from: "Một đồng nghiệp nam", text: "Chúc Sếp thật nhiều sức khỏe để còn “góp ý” cho anh em, tụi em sẽ cố tiếp thu ạ." },
    { from: "Một đồng nghiệp nam", text: "Có Sếp là cả Phòng có phương hướng. Hôm nay anh em xin phép có hoa." },
    { from: "Một đồng nghiệp nam", text: "Chúc Sếp tờ trình nào cũng duyệt ngay vòng đầu, cả chiều đi lẫn chiều về." }
  ],
  wallChiEm: [
    { from: "Một đồng nghiệp nam", text: "Chúc các chị em 20/10 không có việc gì gấp, trừ việc ăn bánh." },
    { from: "Một đồng nghiệp nam", text: "Cảm ơn các chị em đã làm Phòng mình vui hơn nhiều lắm luôn." },
    { from: "Một đồng nghiệp nam", text: "Anh em hứa hôm nay không hỏi “file này để đâu” nữa. Mai hỏi tiếp." },
    { from: "Một đồng nghiệp nam", text: "Không có chị em chắc Phòng mình toàn mùi cà phê với tiếng gõ phím." }
  ]
};

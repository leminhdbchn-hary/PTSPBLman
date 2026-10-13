/* Số lượng từng món quà ở Vòng quay (do trang admin.html chỉnh và lưu).
   Thứ tự đúng với danh sách quà trong config.js: KitKat, cà phê/trà sữa, giúp việc vặt, quà nhỏ.
   Tổng phải bằng 2 × số người (52 người → 104 suất). Mỗi món tối đa 52 (mỗi người chỉ nhận mỗi món 1 lần).
   seed: chuỗi xáo trộn ngẫu nhiên. Đổi seed = xáo lại ai nhận món nào. */
var W20STOCK = { qty: [34, 34, 18, 18], seed: "2010" };

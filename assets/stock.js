/* Số lượng từng món quà ở Vòng quay (do trang admin.html chỉnh và lưu).
   Thứ tự đúng với danh sách quà trong config.js: KitKat, cà phê/trà sữa, KitKat + việc vặt, kem dưỡng da tay.
   Tổng phải bằng số người (52 người → 52 suất, mỗi người quay 1 lần). Mỗi món tối đa 52.
   seed: chuỗi xáo trộn ngẫu nhiên. Đổi seed = xáo lại ai nhận món nào. */
var W20STOCK = { qty: [16, 16, 10, 10], seed: "2010" };

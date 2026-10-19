/* Số lượng từng món quà ở Vòng quay (do trang admin.html chỉnh và lưu).
   Thứ tự đúng với danh sách quà trong config.js: KitKat, nước ép, KitKat + việc vặt, kem dưỡng da tay.
   Tổng phải bằng số người (53 người → 53 suất, mỗi người quay 1 lần). Mỗi món tối đa 53.
   seed: chuỗi xáo trộn ngẫu nhiên. Đổi seed = xáo lại ai nhận món nào. */
var W20STOCK = { qty: [13, 15, 5, 20], seed: "ohewgg" }; /* khớp cấu hình đang lưu trên Firebase */

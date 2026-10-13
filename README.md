# PTSPBLman · Trang chúc mừng 20/10

Trang web tĩnh (không cần cài đặt, không cần máy chủ) chúc mừng 20/10 dành cho chị em Phòng PTSPBL, phong cách hài hước, mở được tốt trên điện thoại.

## Cấu trúc
| File | Dùng để |
| --- | --- |
| `index.html` | Trang người nhận: màn "GO-LIVE", lời chúc chung, Release Notes, máy rút lời chúc, thẻ cào, chọn đặc quyền, **thiệp riêng** (tải PNG / chia sẻ) |
| `tao-thiep.html` | Trang cho người gửi: dán danh sách tên → tạo **link riêng** cho từng người |
| `assets/common.js` | Nội dung (lời chúc, chức danh, đặc quyền...) + hiệu ứng |
| `assets/style.css` | Giao diện |

## Cách dùng thực tế
1. Bật GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Sau 1–2 phút có địa chỉ `https://<tên-tài-khoản>.github.io/PTSPBLman/`.
2. Mở `…/tao-thiep.html`, dán danh sách tên, bấm **Tạo link**.
3. Gửi từng link riêng qua Zalo/Teams. Mỗi người mở link sẽ thấy tên mình, chức danh vui, lời chúc và đặc quyền riêng; có thể tải thiệp PNG.
4. Gửi **link chung** (không tên) cho nhóm chung: ai mở cũng có thể tự nhập tên để nhận thiệp.

Link riêng có dạng: `index.html?to=Lan%20Anh&x=Chị&f=Phòng%20PTSPBL`. Không có dữ liệu nào được lưu trên máy chủ.

## Chỉnh nội dung
Tất cả lời chúc, chức danh, đặc quyền, ưu đãi thẻ cào nằm ở đầu file `assets/common.js` (mảng `wishes`, `roles`, `perks`, `notes`, `coupons`). Trong lời chúc dùng `{x}` cho xưng hô (chị/em/cô/bạn).

Trang chỉ mang tính giải trí nội bộ, không sử dụng logo hay nhận diện thương hiệu của ngân hàng.

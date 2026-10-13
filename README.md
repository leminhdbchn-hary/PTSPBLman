# PTSPBLman · Trang chúc mừng 20/10

Trang web tĩnh (không cần cài đặt, không cần máy chủ) chúc mừng 20/10 dành cho chị em Phòng PTSPBL, phong cách hài hước, mở được tốt trên điện thoại.

## Cấu trúc
| File | Dùng để |
| --- | --- |
| `index.html` | Trang người nhận: màn "GO-LIVE", lời chúc chung, Release Notes, máy rút lời chúc, thẻ cào, chọn đặc quyền, **thiệp riêng** (tải PNG / chia sẻ) |
| `sep.html` | **Bản kính chúc các Sếp** (anh em Nam chúc): tờ trình “Phê duyệt”, hồ sơ năng lực, bản cam kết, xin chỉ đạo, cắm hoa tặng, vòng quay quà, tường lời chúc, giấy khen |
| `tao-thiep.html` | Trang cho người gửi: chọn loại thiệp (chị em / Sếp), dán danh sách tên → tạo **link riêng** cho từng người |
| `assets/config.js` | **Chỗ bạn chỉnh:** tên người gửi, danh sách quà vòng quay, lời chúc trên tường |
| `assets/modules.js` | Cắm hoa, vòng quay quà, tường lời chúc |
| `assets/common.js` | Nội dung (lời chúc, chức danh, đặc quyền...) + hiệu ứng |
| `assets/style.css` | Giao diện |

## Cách dùng thực tế
1. Bật GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `(root)`**. Sau 1–2 phút có địa chỉ `https://<tên-tài-khoản>.github.io/PTSPBLman/`.
2. Mở `…/tao-thiep.html`, dán danh sách tên, bấm **Tạo link**.
3. Gửi từng link riêng qua Zalo/Teams. Mỗi người mở link sẽ thấy tên mình, chức danh vui, lời chúc và đặc quyền riêng; có thể tải thiệp PNG.
4. Gửi **link chung** (không tên) cho nhóm chung: ai mở cũng có thể tự nhập tên để nhận thiệp.

Link riêng có dạng: `index.html?to=Lan%20Anh&x=Chị&f=Phòng%20PTSPBL`. Không có dữ liệu nào được lưu trên máy chủ.

## Chỉnh quà và lời chúc của anh em (`assets/config.js`)
- `prizes`: các món quà ở **Vòng quay** (tối đa 8). Chỉ ghi những món bạn thật sự chuẩn bị.
- `wallSep`, `wallChiEm`: lời chúc thật của anh em hiện trên **Tường lời chúc** (thay các câu mẫu).
- `from`: dòng ký tên ở cuối thiệp.

## Chỉnh nội dung
Tất cả lời chúc, chức danh, đặc quyền, ưu đãi thẻ cào nằm ở đầu file `assets/common.js` (mảng `wishes`, `roles`, `perks`, `notes`, `coupons`). Trong lời chúc dùng `{x}` cho xưng hô (chị/em/cô/bạn).

Trang chỉ mang tính giải trí nội bộ, không sử dụng logo hay nhận diện thương hiệu của ngân hàng.

Link trang: https://leminhdbchn-hary.github.io/PTSPBLman/

## Máy yếu bị giật?
Trang tự bật **chế độ nhẹ** trên máy yếu (hoặc khi thấy giật liên tục). Cũng có thể bấm nút **⚡ Chế độ nhẹ** ở góc dưới bên trái, hoặc thêm `?lite=1` vào cuối link. Chế độ nhẹ giảm số hoa rơi, giảm pháo giấy, bỏ hiệu ứng chuyển động nặng.

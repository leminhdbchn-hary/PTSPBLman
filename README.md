# PTSPBLman · Trang chúc mừng 20/10

Trang web tĩnh chúc mừng 20/10 cho chị em Phòng PTSPBL: hài hước, nhiều hiệu ứng, chạy tốt trên điện thoại và laptop.
Link trang: https://leminhdbchn-hary.github.io/PTSPBLman/

## Các trang
| Trang | Dùng để |
| --- | --- |
| `index.html?u=<mã>` | **Trang của từng chị em**: 8 phần quà mở lần lượt (Release Notes → máy rút lời chúc → thẻ cào → chọn đặc quyền → cắm hoa → vòng quay quà → lời nhắn anh em → thiệp riêng tải về) |
| `admin.html` | **Trang quản lý (cần PIN)**: tìm theo tên, sao chép link từng người, thống kê quà, tải Excel |
| `sep.html?u=<mã>` | Bản kính chúc các Sếp (tờ trình “Phê duyệt”, cam kết, xin chỉ đạo, giấy khen) |
| `tao-thiep.html` | Tạo link thủ công cho người không có trong danh sách |

## Dữ liệu và cấu hình
| File | Nội dung |
| --- | --- |
| `assets/people.js` | Danh sách chị em (chỉ **tên + chức vụ**; không có ngày sinh, email). `bd: 1` = sinh nhật tháng 10 để chúc thêm |
| `assets/config.js` | **Chỗ anh em chỉnh**: PIN trang quản lý, danh sách quà + số lượng, form nhận “thẻ nhờ việc”, lời nhắn trên tường |
| `assets/common.js` | Lời chúc, chức danh vui, đặc quyền, thẻ cào… |

## Quà và vòng quay
- Mỗi chị em được **chia sẵn 1 món** theo số lượng `qty` trong `config.js` (để trống thì chia đều). Quay ở máy nào cũng ra đúng món đó, mỗi người chỉ quay 1 lần.
- Xem ai nhận gì ở `admin.html` → tab **Thống kê quà** (có tải Excel). Chỉ đổi `qty` hoặc `seed` **trước khi gửi link**.
- **Thẻ nhờ anh em 1 việc**: chị em ghi việc muốn nhờ rồi bấm Gửi. Mặc định nút này sao chép lời nhờ để dán vào nhóm chat. Muốn gom tập trung thì tạo Google Form và điền vào `requestForm` trong `config.js`.

## Máy yếu bị giật?
Trang tự bật **chế độ nhẹ** trên máy yếu. Có thể bấm nút **⚡ Chế độ nhẹ** ở góc dưới bên trái, hoặc thêm `&lite=1` vào cuối link.

Phông chữ Be Vietnam Pro, Playfair Display, Dancing Script (giấy phép SIL Open Font License) được đặt sẵn trong `assets/fonts`.
Trang chỉ mang tính giải trí nội bộ, không dùng logo hay nhận diện thương hiệu của ngân hàng.

# PTSPBLman · Trang chúc mừng 20/10

Trang web tĩnh chúc mừng 20/10 cho chị em Phòng PTSPBL: hài hước, nhiều hiệu ứng, chạy tốt trên điện thoại và laptop.
Link trang: https://leminhdbchn-hary.github.io/PTSPBLman/

## Các trang
| Trang | Dùng để |
| --- | --- |
| `index.html?u=<mã>` | **Trang của từng chị em**: 7 phần mở lần lượt, xong phần nào tự sang phần kế (Release Notes → máy rút lời chúc → thẻ cào → cắm hoa có các anh chibi chạy ra tặng → vòng quay 2 lượt → lời nhắn anh em → thiệp riêng tải về). Lãnh đạo mở link này sẽ tự chuyển sang trang Sếp |
| `admin.html` | **Trang quản lý (cần PIN)**: tìm theo tên, sao chép link từng người (lãnh đạo chỉ có link Sếp), thống kê quà, tải Excel |
| `sep.html?u=<mã>` | Bản kính chúc các Sếp (tờ trình “Phê duyệt”, cam kết, xin chỉ đạo, giấy khen) |
| `tao-thiep.html` | Tạo link thủ công cho người không có trong danh sách |
| `assets/men/` | Ảnh đầu các anh (đã cắt sẵn) cho phần cắm hoa. Thêm người: bỏ `h8.webp`… vào đây rồi thêm 1 dòng vào `men` trong `assets/config.js` |

## Dữ liệu và cấu hình
| File | Nội dung |
| --- | --- |
| `assets/people.js` | Danh sách chị em (chỉ **tên + chức vụ**; không có ngày sinh, email). `bd: 1` = sinh nhật tháng 10 để chúc thêm |
| `assets/config.js` | **Chỗ anh em chỉnh**: PIN trang quản lý, danh sách quà + số lượng, form nhận “thẻ nhờ việc”, lời nhắn trên tường |
| `assets/common.js` | Lời chúc, chức danh vui, đặc quyền, thẻ cào… |

## Quà và vòng quay
- Mỗi chị em quay **2 lượt, nhận 2 món KHÁC NHAU**, chia sẵn theo số lượng `qty` trong `config.js` (tổng cần = 2 × số người; để trống thì chia đều). Quay ở máy nào cũng ra đúng 2 món đó.
- Xem ai nhận gì ở `admin.html` → tab **Thống kê quà** (số suất mỗi món cần chuẩn bị, có tải Excel). Chỉ đổi `qty` hoặc `seed` **trước khi gửi link**.
- **Thẻ nhờ anh em 1 việc bất kỳ**: chị em ghi việc muốn nhờ rồi bấm Gửi. Mặc định nút này sao chép lời nhờ để dán vào nhóm chat. Muốn gom tập trung thì tạo Google Form và điền vào `requestForm` trong `config.js`.
- Xưng hô: mặc định "Chị"; sinh từ 1995 trở đi là "Em" (trường `x` trong `assets/people.js`). Lãnh đạo (6 người) dùng trang Sếp.

## Máy yếu bị giật?
Trang tự bật **chế độ nhẹ** trên máy yếu. Có thể bấm nút **⚡ Chế độ nhẹ** ở góc dưới bên trái, hoặc thêm `&lite=1` vào cuối link.

Phông chữ Be Vietnam Pro, Playfair Display, Dancing Script (giấy phép SIL Open Font License) được đặt sẵn trong `assets/fonts`.
Trang chỉ mang tính giải trí nội bộ, không dùng logo hay nhận diện thương hiệu của ngân hàng.

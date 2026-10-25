# Nếp Nhà — Phân tích & kế hoạch (Giai đoạn 1)

Tài liệu này ghi lại các quyết định trước khi viết code. Phần "Hiện trạng" ở cuối là bản cập nhật sau khi làm xong.

## 1. Tóm tắt sản phẩm

Nếp Nhà là sổ ký ức riêng tư của gia đình: mỗi gia đình có một không gian riêng, các thành viên cùng ghi lại ký ức
(chữ + ảnh), xem lại theo dòng thời gian, lưu hồ sơ người thân và (sau này) gia phả, lời kể, thư gửi tương lai.
Trọng tâm: **riêng tư, ấm áp, dễ dùng với người lớn tuổi**, không phải mạng xã hội.

Người dùng chính: người giữ sổ (30–50 tuổi, tạo không gian và mời người thân), người thân lớn tuổi (chỉ xem, đôi khi bình luận),
người đóng góp (con, cháu thêm ký ức và ảnh).

## 2. Kiến trúc

| Lớp | Lựa chọn | Lý do |
|---|---|---|
| Web | Next.js 15 (App Router) + React 19 + TypeScript | Server Components + Server Actions: ít JS ở client, dễ kiểm soát quyền ở server |
| Giao diện | Tailwind CSS 3, font Newsreader (tiêu đề) + Be Vietnam Pro (nội dung) | Bảng màu giấy/kem/rêu, nhẹ, tối giản |
| Dữ liệu | Supabase Postgres + Row Level Security | Phân quyền nằm **trong cơ sở dữ liệu**, không chỉ trong code |
| Đăng nhập | Supabase Auth (email + mật khẩu), phiên lưu cookie qua `@supabase/ssr` | Không tự viết cơ chế mật khẩu |
| Ảnh | Supabase Storage, bucket **private** `family-media`, signed URL 1 giờ | Không có URL công khai |
| Kiểm tra dữ liệu | Zod ở server action; ràng buộc `check`/FK/trigger ở DB | Hai lớp độc lập |

Nguyên tắc: trình duyệt chỉ có `anon key`. Không dùng `service_role` ở bất kỳ đâu trong app; mọi thao tác "đặc quyền"
(tạo gia đình, đổi vai trò, nhận lời mời, xoá gia đình…) là hàm `security definer` trong Postgres tự kiểm tra `auth.uid()`.

## 3. Sơ đồ trang

Công khai: `/` giới thiệu, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/privacy`, `/invite/[token]`.

Sau đăng nhập: `/onboarding` (tạo gia đình hoặc dùng liên kết mời), `/family` (tổng quan), `/family/memories` (+ `new`, `[id]`, `[id]/edit`),
`/family/members` (+ `new`, `[id]`, `[id]/edit`), `/family/tree`, `/family/stories` và `/family/letters` (chưa làm, có trang giải thích),
`/family/manage` (thành viên, lời mời, dữ liệu mẫu, xoá gia đình), `/settings` (hồ sơ, mật khẩu, xuất dữ liệu, yêu cầu xoá tài khoản), `/api/export`.

## 4. Vai trò

`owner` (1 người, không thể tự rời nếu còn người khác — phải chuyển quyền) › `admin` › `contributor` › `viewer`.

| | viewer | contributor | admin | owner |
|---|:-:|:-:|:-:|:-:|
| Xem ký ức "cả nhà" / bình luận | ✔ | ✔ | ✔ | ✔ |
| Thêm ký ức, ảnh, hồ sơ | | ✔ | ✔ | ✔ |
| Sửa/xoá nội dung của mình | | ✔ | ✔ | ✔ |
| Sửa/xoá nội dung của người khác | | | ✔ | ✔ |
| Mời thành viên, đổi vai trò (không đụng admin khác) | | | ✔ | ✔ |
| Chuyển quyền chủ sở hữu, đổi admin, xoá gia đình | | | | ✔ |

Chế độ hiển thị mỗi ký ức: `private` (chỉ người viết — **kể cả chủ sở hữu cũng không thấy**), `admins` (quản trị), `family` (cả nhà).

## 5. Luồng chính

1. Đăng ký → (xác minh email nếu bật) → `/onboarding` → tạo gia đình (trở thành chủ sở hữu).
2. Mời: quản trị tạo liên kết (token ngẫu nhiên 32 byte, **chỉ lưu SHA-256**, hiện đúng một lần, hết hạn 1–30 ngày, dùng một lần,
   tuỳ chọn khoá theo email). Người nhận mở `/invite/[token]`, xem tên gia đình, đăng ký/đăng nhập, bấm tham gia.
3. Thêm ký ức: form → server action lưu → trình duyệt tải ảnh **trực tiếp** lên Storage bằng phiên của người dùng (RLS áp dụng) → gắn vào ký ức.
4. Xem lại: dòng thời gian nhóm theo năm, lọc theo năm/chủ đề/thành viên, tìm kiếm, tải thêm.

## 6. Mô hình dữ liệu (tóm tắt, chi tiết ở `supabase/migrations/`)

`profiles` · `families` · `family_memberships` · `people` (hồ sơ thành viên, có thể chưa có tài khoản) · `family_relationships` (cha/mẹ, vợ/chồng) ·
`memories` · `memory_people` · `memory_media` · `comments` · `stories` · `letters` · `invitations` · `account_deletion_requests`.

Điểm đáng chú ý:
- **Khoá ngoại ghép `(id, family_id)`** giữa các bảng con và cha: một dòng của gia đình A không thể trỏ tới dòng của gia đình B, kể cả khi ai đó đoán được UUID.
- **Trigger**: giữ đúng 1 chủ sở hữu; chặn vòng lặp cha-con, tối đa 2 cha/mẹ, vợ/chồng không tự nối; khoá `family_id`/`created_by` không cho sửa sau khi tạo.
- **Ngày sinh** là cột bị thu hồi quyền đọc trực tiếp; chỉ đọc qua `people_directory()`, hàm này che ngày sinh khi hồ sơ để riêng tư (trừ chính chủ và quản trị).
- **Thư gửi tương lai**: RLS ẩn thư chưa tới ngày mở với mọi người, kể cả người nhận; người viết xem lại thư của mình.
- **Storage**: đường dẫn `{family_id}/memories|people/...`; chính sách đọc kiểm tra đúng thành viên và (với ảnh ký ức) ký ức đó hiển thị với người xem.

## 7. Rủi ro & giả định

| Rủi ro | Cách xử lý / còn lại |
|---|---|
| Lộ dữ liệu giữa gia đình | RLS + khoá ngoại ghép + 75 kiểm tra trên Postgres thật + kiểm thử đầu-cuối hai gia đình |
| Ảnh trẻ em | Bucket private, signed URL ngắn hạn, không index, cảnh báo trong chính sách. **Cần rà soát pháp lý** trước khi mở rộng |
| Xoá tài khoản | Hiện là *yêu cầu* người vận hành xử lý thủ công (xoá user cần quyền admin của Supabase) |
| Giới hạn tải lên | 25 MB/ảnh, 12 ảnh/ký ức, tự thu nhỏ về 2400 px ở trình duyệt; chỉ ảnh JPEG/PNG/WebP/HEIC |
| Email | Supabase gửi mặc định bị giới hạn tần suất; bản thật nên cấu hình SMTP riêng |
| Tên miền/DNS cho liên kết mời | Dùng `NEXT_PUBLIC_SITE_URL` |

Giả định: một gia đình nhỏ (< vài trăm ký ức) là kịch bản chính; chưa tối ưu cho hàng chục nghìn bản ghi.

## 8. Phạm vi

MVP (đã làm): giới thiệu, đăng ký/đăng nhập/quên mật khẩu, tạo gia đình, mời, ký ức + nhiều ảnh, dòng thời gian, hồ sơ thành viên, riêng tư,
gia phả cơ bản, bình luận, dữ liệu mẫu, xuất dữ liệu, cài đặt.
Chưa làm: lời kể (stories) và thư gửi tương lai (letters) — **đã có bảng + RLS + kiểm thử ở DB**, chưa có giao diện; ghi âm; xuất sách; thanh toán.

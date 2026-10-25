# Nếp Nhà — sổ ký ức riêng tư của gia đình

Mỗi gia đình một không gian riêng: ghi lại ký ức (chữ + ảnh), xem lại theo dòng thời gian, lưu hồ sơ người thân và gia phả.
Giao diện tiếng Việt, tối giản, ưu tiên người lớn tuổi. Dữ liệu **không công khai**.

Công nghệ: Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Storage private) · Zod.

> **Trạng thái trung thực:** mã nguồn đã được build, lint, kiểm tra kiểu, chạy test đơn vị, test phân quyền trên Postgres thật và test
> đầu-cuối bằng trình duyệt (xem mục [Kiểm thử](#kiểm-thử)). Nó **chưa được chạy với một dự án Supabase thật** và **chưa được triển khai**
> ở đâu cả — bạn cần làm các bước ở mục [Cài đặt Supabase](#cài-đặt-supabase). Xem [Tính năng & giới hạn](#tính-năng--giới-hạn) trước khi dùng cho gia đình thật.

## Chạy thử trên máy

Cần Node.js ≥ 20.

```bash
npm install
cp .env.example .env.local     # rồi điền giá trị Supabase (xem dưới)
npm run dev                    # http://localhost:3000
```

Nếu chưa cấu hình Supabase, trang giới thiệu vẫn mở được; các trang cần đăng nhập sẽ đưa về trang chủ kèm thông báo thiếu cấu hình.

### Biến môi trường (`.env.local`)

| Biến | Bắt buộc | Ý nghĩa |
|---|:-:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✔ | URL dự án Supabase (Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✔ | `anon` public key. **Không** dùng `service_role` ở đâu trong dự án này |
| `NEXT_PUBLIC_SITE_URL` | nên có | Địa chỉ công khai của web (dùng cho liên kết trong email, liên kết mời). Ví dụ `https://nepnha.example` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | | Email liên hệ hiển thị ở chân trang và chính sách bảo mật |

## Cài đặt Supabase

1. Tạo dự án tại <https://supabase.com> (chọn vùng gần người dùng, ví dụ Singapore).
2. **Tạo schema**: mở *SQL Editor*, dán toàn bộ `supabase/migrations/20261026000001_init.sql` rồi chạy.
   (Hoặc dùng Supabase CLI: `supabase link --project-ref <ref>` rồi `supabase db push`.)
   Migration tạo bảng, chính sách RLS, hàm nghiệp vụ, trigger và bucket Storage private `family-media`.
3. **Authentication → URL Configuration**: đặt *Site URL* = `NEXT_PUBLIC_SITE_URL`; thêm vào *Redirect URLs*:
   `https://<miền của bạn>/auth/callback` và `http://localhost:3000/auth/callback`.
4. **Authentication → Providers → Email**: bật *Confirm email* (khuyến nghị). Nếu tắt, người dùng vào thẳng sau khi đăng ký.
   Nên đặt độ dài mật khẩu tối thiểu ≥ 8 (khớp với form).
5. **Authentication → Emails**: sửa mẫu email sang tiếng Việt nếu muốn; cấu hình SMTP riêng trước khi mời nhiều người
   (email mặc định của Supabase giới hạn rất thấp).
6. Lấy `Project URL` và `anon public key` ở *Project Settings → API* điền vào `.env.local`.
7. (Tuỳ chọn) kiểm tra *Storage* có bucket `family-media`, **Public = off**.

## Triển khai (Vercel)

Next.js cần môi trường Node (Server Actions, middleware) — dùng Vercel, hoặc bất kỳ nơi chạy được `next start`. Firebase Hosting tĩnh **không** đủ.

1. Đẩy mã lên GitHub, import vào Vercel (Framework: Next.js).
2. Thêm 4 biến môi trường ở trên (Production + Preview).
3. Deploy. Sau đó cập nhật *Site URL* / *Redirect URLs* ở Supabase cho đúng miền thật.
4. Mở web → đăng ký → tạo gia đình → thử *Quản lý → Thêm dữ liệu mẫu* để xem thử.

## Cấu trúc thư mục

```
supabase/migrations/   SQL: bảng, RLS, hàm, trigger, Storage
src/app/               trang (App Router) + src/app/actions/ (server actions)
src/lib/               supabase client, phiên, kiểm tra dữ liệu (Zod), cây gia phả, dữ liệu mẫu
src/components/        thành phần giao diện
scripts/test-rls.mjs   test phân quyền trên Postgres thật (embedded)
scripts/e2e/           test đầu-cuối bằng trình duyệt (Playwright) với Supabase "giả" dựng trên Postgres thật
docs/PLAN.md           phân tích, kiến trúc, mô hình dữ liệu, rủi ro
```

## Kiểm thử

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest (hàm thuần: kiểm tra dữ liệu, cây gia phả, đường dẫn an toàn…)
npm run test:rls    # 75 kiểm tra RLS/trigger/Storage trên PostgreSQL 17 thật (embedded, không cần Docker)
npm run test:e2e    # ~35 bước trình duyệt thật (Chromium qua Playwright): đăng ký → gia đình → ký ức + ảnh → mời → phân quyền → ...
npm run build
```

- `test:rls` chạy **migration thật** trên Postgres thật, giả lập schema `auth`/`storage` của Supabase. Kiểm tra: cách ly giữa hai gia đình, khoá ngoại chéo, vai trò, chế độ hiển thị, ngày sinh bị che, vòng lặp gia phả, thư chưa mở, lời mời, xoá tài khoản, Storage.
- `test:e2e` build app, chạy `next start`, và trỏ nó vào `scripts/e2e/fake-supabase.mjs` — một máy chủ mô phỏng giao thức Auth/PostgREST/Storage
  của Supabase ở phía trước **cùng Postgres thật** (mỗi truy vấn chạy dưới `role authenticated` với JWT của người dùng nên RLS có hiệu lực).
  Cần Chromium (`/opt/pw-browsers/...` hoặc đặt biến `CHROME_PATH`). Chạy ~4 phút.
  **Giới hạn:** đây không phải Supabase thật; PostgREST/GoTrue/Storage thật có thể khác ở chi tiết (định dạng lỗi, giới hạn, email). Hãy tự thử một vòng trên dự án thật sau khi cài đặt.

## Tính năng & giới hạn

| Tính năng | Trạng thái |
|---|---|
| Trang giới thiệu, chính sách bảo mật | ✔ |
| Đăng ký, đăng nhập, đăng xuất, quên/đặt lại mật khẩu | ✔ (cần cấu hình email ở Supabase) |
| Tạo gia đình, chuyển giữa nhiều gia đình, rời gia đình, chuyển quyền chủ, xoá gia đình | ✔ |
| Mời bằng liên kết (hết hạn, dùng một lần, tuỳ chọn khoá theo email, thu hồi được) | ✔ — **chưa tự gửi email**: bạn sao chép liên kết gửi cho người thân |
| Ký ức: thêm/sửa/xoá, nhiều ảnh, thẻ chủ đề, gắn người, 3 mức hiển thị | ✔ |
| Dòng thời gian: nhóm theo năm, tìm kiếm, lọc năm/chủ đề/thành viên, tải thêm | ✔ |
| Chi tiết ký ức: thư viện ảnh, ký ức liên quan, bình luận | ✔ |
| Hồ sơ thành viên, ảnh đại diện, ngày sinh có thể ẩn | ✔ |
| Gia phả (cha/mẹ, vợ/chồng, chặn vòng lặp) | ✔ cơ bản — sơ đồ theo thế hệ, **chưa** có kéo-thả/in |
| Cài đặt: hồ sơ, đổi mật khẩu, xuất dữ liệu JSON, yêu cầu xoá tài khoản | ✔ |
| Dữ liệu mẫu (gắn nhãn, xoá một lần) | ✔ |
| Lời kể (stories), Thư gửi tương lai | ◐ có bảng + RLS + test ở DB, **chưa có giao diện** (trang báo "sắp ra mắt") |
| Ghi âm giọng nói, xuất sách ảnh, thanh toán | ✘ chưa làm (thanh toán không nằm trong kế hoạch) |

Giới hạn cần biết:
- **Xoá tài khoản** hiện chỉ ghi nhận *yêu cầu*; người vận hành xoá user trong Supabase Dashboard (cần quyền admin, nên không làm được từ trình duyệt một cách an toàn).
- **Xuất dữ liệu** gồm chữ và danh sách ảnh; **chưa** đóng gói file ảnh gốc.
- **Ngày mở thư** (khi làm giao diện) so theo `current_date` UTC.
- Ảnh được thu nhỏ về ≤ 2400 px ở trình duyệt trước khi tải; HEIC phụ thuộc trình duyệt giải mã được.
- Các thao tác thay đổi dữ liệu làm mới trang bằng `router.refresh()` thay vì `revalidatePath()` trong action: test đầu-cuối cho thấy với Next 15.5, thao tác liên tiếp rất nhanh (< 1 giây) trên cùng một form có thể làm nút "Đang lưu…" đứng hình khi dùng `revalidatePath`.
- Cần thêm: giới hạn tần suất đăng nhập/đăng ký (Supabase có mặc định, nên bật CAPTCHA nếu mở công khai), sao lưu định kỳ, theo dõi lỗi, và **rà soát pháp lý**
  (dữ liệu cá nhân, ảnh trẻ em, quy định bảo vệ dữ liệu cá nhân ở Việt Nam) trước khi mời người dùng thật.

## Bảo mật — tóm tắt

- RLS bật trên mọi bảng; mặc định từ chối. Các thao tác đặc quyền là hàm `security definer` tự kiểm tra `auth.uid()` và vai trò.
- Không có `service_role` trong mã hay biến môi trường của web.
- Ảnh trong bucket private; trình duyệt chỉ nhận signed URL hết hạn sau 1 giờ và chỉ cho ảnh mà RLS cho phép người đó xem.
- Token mời là 32 byte ngẫu nhiên, chỉ lưu SHA-256, dùng một lần, hết hạn.
- Đăng xuất chỉ nhận POST; `?next=` chỉ chấp nhận đường dẫn nội bộ; có CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Phản hồi "quên mật khẩu" giống nhau dù email có tồn tại hay không.

## Giấy phép

Chưa chọn giấy phép — bạn quyết định trước khi công bố mã.

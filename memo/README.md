# Memo (bản Firebase) — sổ ký ức riêng tư của gia đình

Mỗi gia đình một không gian riêng: ghi lại ký ức (chữ + ảnh), xem theo dòng thời gian, lưu hồ sơ người thân, gia phả, lời nhắn.
Bản này chạy hoàn toàn trên **Firebase** (Hosting + Authentication + Firestore), triển khai đúng quy trình quen thuộc: **đẩy GitHub → `firebase deploy` → có link**.
Không cần máy chủ riêng, không cần Supabase/Vercel, **không cần gói trả phí** (ảnh được nén ngay trên máy rồi lưu trong Firestore, không dùng Cloud Storage).

Công nghệ: Vite + React 18 + TypeScript · Tailwind CSS · Firebase JS SDK 10 · Zod · luật bảo mật Firestore.

## Kiểm thử đã chạy

| Lệnh | Nội dung | Kết quả |
|---|---|---|
| `npm run typecheck` | TypeScript | sạch |
| `npm run lint` | ESLint | sạch |
| `npm test` | 13 test đơn vị (kiểm tra dữ liệu, gia phả, mã mời, sắp xếp, âm thanh) | 13/13 |
| `npm run test:rules` | 45 bài kiểm tra **luật bảo mật** trên Firestore Emulator: cách ly hai gia đình, lời mời dùng một lần/hết hạn/thu hồi/khoá email, chống nâng quyền, ký ức riêng tư (kể cả chủ sở hữu không đọc được), ảnh theo quyền ký ức, ngày sinh riêng tư, gia phả, rời & xoá gia đình | 45/45 |
| `RULES_FILE=firestore.deploy.rules …` | như trên, với **bản luật gộp** dùng khi deploy chung dự án với site Phòng (+2 bài kiểm tra site Phòng vẫn chạy như cũ) | 45/45 (gồm cả luật site Phòng) |
| `npm run test:e2e` | 55 bước trên **trình duyệt thật** + Firebase Emulator: đăng ký → tạo gia đình → ký ức 2 ảnh → tìm kiếm/lọc → gia đình thứ hai tấn công bằng token thật qua API (bị chặn) → mời → phân quyền → bình luận → hồ sơ + ảnh đại diện → gia phả → dữ liệu mẫu → xoá ký ức → cài đặt/đổi mật khẩu → xuất JSON → rời gia đình → đăng xuất → quên mật khẩu → xoá tài khoản → xoá gia đình | 55/55 |

Emulator dùng project `demo-memo` nên kiểm thử **không chạm** dự án thật. Cần Java (cho Firestore Emulator) và Chromium (biến `CHROME_PATH` nếu khác mặc định).

## Chạy trên máy

```bash
npm install
# cách 1: không cần dự án thật — dùng trình giả lập
npx firebase emulators:start --only auth,firestore --project demo-memo   # cửa sổ 1
VITE_USE_EMULATORS=1 npm run dev                                           # cửa sổ 2 → http://localhost:5173
# cách 2: nối dự án thật — điền .env.local theo .env.example rồi npm run dev
```

## Triển khai lên Firebase

Cần làm **một lần** trong [Firebase Console](https://console.firebase.google.com) của dự án:

1. **Authentication → Get started → Sign-in method → Email/Password → Enable** (chỉ bật dòng đầu, không cần "Email link").
2. **Firestore Database** phải có sẵn (dự án `ptspbl-man-2010` đã có vì site Phòng đang dùng).
3. (Tuỳ chọn) **Authentication → Templates**: đổi ngôn ngữ email sang tiếng Việt.

Rồi deploy:

```bash
npm run build
# tạo site Hosting riêng (một lần)
npx firebase hosting:sites:create memo-gia-dinh --project <PROJECT_ID>
# nếu dùng chung dự án với site Phòng: gộp luật để không mất luật của site Phòng
node scripts/combine-rules.mjs ../firestore.rules firestore.deploy.rules
npx firebase deploy --config firebase.deploy.json --only hosting,firestore:rules,firestore:indexes --project <PROJECT_ID>
```

Link sẽ là `https://memo-gia-dinh.web.app`. Ứng dụng tự đọc cấu hình từ `/__/firebase/init.json` của Firebase Hosting, không cần nhúng khoá vào mã.

> **Lưu ý khi dùng chung dự án với site Phòng:** Firestore mỗi dự án chỉ có **một** bộ luật. Luôn deploy bằng `firebase.deploy.json`
> (bản gộp sinh từ `scripts/combine-rules.mjs`). Nếu sau này sửa luật của site Phòng, chạy lại bước gộp trước khi deploy Memo, và
> ngược lại, khi deploy site Phòng phải dùng bản gộp này, nếu không luật của Memo sẽ bị xoá và mọi người không vào được sổ.
> Cách gọn hơn về lâu dài: tạo **dự án Firebase riêng** cho Memo (khi đó dùng `firebase.json` + `firestore.rules` trực tiếp).

## Cấu trúc

```
firestore.rules           luật bảo mật (toàn bộ phân quyền nằm ở đây)
firestore.deploy.rules    bản gộp với luật site Phòng (sinh tự động)
firestore.indexes.json    chỉ mục cho truy vấn "các gia đình của tôi"
src/lib/data.ts           mọi thao tác đọc/ghi Firestore
src/lib/session.tsx       đăng nhập, gia đình đang mở
src/pages/, src/components/   giao diện
tests/firestore.rules.test.ts  kiểm thử luật bảo mật
scripts/e2e.mjs           kiểm thử đầu-cuối bằng trình duyệt
```

## Mô hình dữ liệu (Firestore)

`nn_users/{uid}` hồ sơ tài khoản · `nn_families/{fid}` gia đình, bên trong: `members/{uid}` (vai trò) · `memories/{id}` (+ `comments`) ·
`photos/{id}` (ảnh JPEG nén, ≤ ~950 KB/ảnh) · `people/{id}` · `peoplePrivate/{id}` (ngày sinh để riêng tư) · `relationships/{kind_a_b}` ·
`invites/{sha256(mã)}` · `registry/{id}` (sổ id để chủ sở hữu dọn sạch khi xoá gia đình, không chứa nội dung).

## Tính năng & giới hạn

| | |
|---|---|
| Đăng ký, đăng nhập, đăng xuất, quên mật khẩu (email của Firebase) | ✔ |
| Tạo gia đình, nhiều gia đình, mời bằng liên kết (một lần, có hạn, thu hồi, khoá email), vai trò | ✔ (liên kết mời tự sao chép gửi, chưa tự gửi email) |
| Ký ức: ảnh trước – chữ sau, tiêu đề tự đặt nếu bỏ trống, ngày tự lấy từ ảnh, tự lưu bản nháp, 3 mức hiển thị, sửa/xoá | ✔ |
| Dòng thời gian dạng album: gõ là lọc ngay (không dấu), nhảy theo năm, lọc chủ đề/người, xem thêm; ký ức trước/sau, vuốt ảnh | ✔ |
| Điện thoại (iPhone): thanh điều hướng dưới + nút “+”, vùng an toàn, ô nhập ≥ 16 px, ô bấm ≥ 40 px | ✔ (`npm run` → `node scripts/mobile-audit.mjs`) |
| Hồ sơ người thân, ảnh đại diện, ngày sinh riêng tư; gia phả, chặn vòng lặp | ✔ |
| Lời nhắn (kể cả người chỉ xem) | ✔ |
| Dữ liệu mẫu, xuất JSON, đổi mật khẩu, **tự xoá tài khoản** | ✔ |
| **Lời kể bằng giọng nói**: ghi âm ≤ 3 phút bằng micro trình duyệt (Chrome/Android: webm, Safari/iPhone: mp4), tạm dừng, nghe lại trước khi lưu, chọn người kể + câu hỏi gợi ý; lưu trong Firestore, chỉ tải âm thanh khi bấm Nghe | ✔ |
| **Giao diện Memo (Warm Minimalism)**: nền kem, xanh sage, chữ Lora + Be Vietnam Pro (hai phông, đều có tiếng Việt đầy đủ); trang chủ có ảnh bìa + thống kê + kỷ niệm gần đây; album lưới theo năm, xem ảnh lớn (vuốt/phím mũi tên/Esc); timeline; trạng thái đang tải/trống/lỗi có nút Thử lại (mất mạng không bị nhầm là chưa có dữ liệu) | ✔ |
| Thư gửi tương lai, xuất sách | ✘ chưa làm (có trang "sắp ra mắt") |

Giới hạn cần biết:
- Ảnh được nén còn cạnh dài ~1600 px (đủ xem trên điện thoại/máy tính, không phải bản gốc để in lớn). Mỗi ký ức tối đa 12 ảnh.
- Gói miễn phí Firestore: 1 GiB dữ liệu (≈ 2.000–4.000 ảnh), 50.000 lượt đọc/ngày — dư cho một gia đình. Nếu dự án ở gói miễn phí Spark thì vượt hạn mức chỉ bị tạm ngưng tới hôm sau, không phát sinh tiền.
- Dòng thời gian tải toàn bộ ký ức được xem rồi lọc trên máy: hợp với sổ gia đình (vài trăm–vài nghìn ký ức), không dành cho quy mô lớn.
- Chặn vòng lặp gia phả được kiểm ở ứng dụng; luật bảo mật chỉ chặn quan hệ sai định dạng/người không tồn tại (vòng lặp chỉ là dữ liệu sai, không phải lỗ hổng).
- Khi quản trị viên đổi vai trò của ai đó, người đó thấy quyền mới sau khi chuyển trang/quay lại tab (luật bảo mật áp dụng ngay lập tức).
- Chưa có giới hạn tần suất riêng ngoài cơ chế chống spam mặc định của Firebase Auth; nên bật **App Check** nếu mở công khai rộng.
- Ảnh trẻ em và dữ liệu cá nhân: nên rà soát pháp lý trước khi mời nhiều người.

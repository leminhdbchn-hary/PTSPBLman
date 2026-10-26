import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { contactEmail } from "@/lib/env";

export const metadata: Metadata = { title: "Chính sách bảo mật" };

export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main id="noi-dung" className="container-page max-w-read py-16">
        <h1 className="text-[2.4rem]">Chính sách bảo mật</h1>
        <p className="mt-3 text-stone">Bản thử nghiệm. Đây là bản mô tả cách Memo xử lý dữ liệu; hãy rà soát với tư vấn pháp lý trước khi vận hành thương mại.</p>
        <div className="mt-10 space-y-8 text-[1.05rem] leading-relaxed">
          <section><h2 className="text-[1.5rem]">Chúng tôi lưu những gì</h2><p className="mt-3">Email, họ tên và mật khẩu (được băm, chúng tôi không đọc được) của bạn; nội dung bạn tự thêm vào sổ gia đình (ký ức, ảnh, hồ sơ thành viên, quan hệ gia phả, bình luận); và thông tin kỹ thuật tối thiểu để đăng nhập.</p></section>
          <section><h2 className="text-[1.5rem]">Ai xem được dữ liệu</h2><p className="mt-3">Chỉ thành viên của gia đình đó, theo vai trò được cấp. Mỗi ký ức có thể đặt chế độ: cả gia đình, chỉ quản trị viên hoặc chỉ mình bạn. Nội dung không công khai ra internet và không hiển thị cho gia đình khác.</p></section>
          <section><h2 className="text-[1.5rem]">Chúng tôi không làm gì</h2><p className="mt-3">Không bán dữ liệu, không hiển thị quảng cáo, không dùng nội dung gia đình để huấn luyện AI và không chia sẻ cho bên thứ ba ngoài nhà cung cấp hạ tầng lưu trữ cần thiết để vận hành dịch vụ.</p></section>
          <section><h2 className="text-[1.5rem]">Ảnh của trẻ em</h2><p className="mt-3">Hãy chỉ đăng ảnh trẻ em khi cha mẹ hoặc người giám hộ đồng ý. Người quản trị gia đình chịu trách nhiệm về nội dung được mời vào sổ.</p></section>
          <section><h2 className="text-[1.5rem]">Quyền của bạn</h2><p className="mt-3">Bạn có thể xem và sửa hồ sơ, tải dữ liệu của mình (định dạng JSON) và yêu cầu xoá tài khoản trong trang Cài đặt. Chủ sở hữu có thể xoá toàn bộ gia đình cùng ảnh và nội dung.</p></section>
          <section><h2 className="text-[1.5rem]">Thư gửi tương lai</h2><p className="mt-3">Chúng tôi không cam kết thư sẽ được chuyển giao tự động sau nhiều thập kỷ. Bạn nên duy trì tài khoản và sao lưu dữ liệu định kỳ.</p></section>
          <section><h2 className="text-[1.5rem]">Liên hệ</h2><p className="mt-3">Mọi yêu cầu về dữ liệu cá nhân, xin gửi tới <a href={`mailto:${contactEmail()}`} className="underline">{contactEmail()}</a>.</p></section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

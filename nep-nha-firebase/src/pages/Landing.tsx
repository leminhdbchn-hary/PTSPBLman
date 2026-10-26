import { Link } from "react-router-dom";
import { useEffect } from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

const FEATURES = [
  { t: "Dòng thời gian ký ức", d: "Ảnh và câu chuyện xếp theo năm như một cuốn nhật ký ảnh. Tìm lại bất cứ khoảnh khắc nào bằng thẻ, người hoặc từ khoá." },
  { t: "Cả nhà cùng viết", d: "Mời ông bà, cha mẹ, anh chị em cùng đóng góp. Mỗi người có vai trò riêng: quản trị, đóng góp hoặc chỉ xem." },
  { t: "Hồ sơ từng người thân", d: "Giữ lại tên, vai vế, vài dòng tiểu sử và những ký ức gắn với từng người, kể cả người chưa dùng máy tính." },
  { t: "Gia phả", d: "Nối cha mẹ, con cái, vợ chồng và xem các thế hệ trong một sơ đồ rõ ràng. Hệ thống chặn những quan hệ vô lý." },
  { t: "Riêng tư từ gốc", d: "Mỗi gia đình là một không gian khép kín. Chỉ người được mời mới mở được, theo đúng vai trò của mình." },
  { t: "Sắp tới", d: "Lời kể của ông bà (ghi âm), thư gửi tương lai và xuất cuốn sách gia đình đang được chuẩn bị." },
];

const STEPS = [
  { n: "1", t: "Tạo sổ gia đình", d: "Đăng ký bằng email, đặt tên cho gia đình. Bạn là chủ sở hữu của cuốn sổ." },
  { n: "2", t: "Mời người thân", d: "Gửi liên kết mời có thời hạn. Ai nhận lời mới vào được, bạn có thể thu hồi bất cứ lúc nào." },
  { n: "3", t: "Cùng lưu giữ", d: "Mỗi người thêm ảnh và câu chuyện của mình. Cuốn sổ dày lên theo năm tháng." },
];

export default function Landing() {
  useEffect(() => { document.title = "Nếp Nhà — Sổ ký ức gia đình"; }, []);
  return (
    <>
      <SiteHeader />
      <main id="noi-dung">

        <section className="container-page grid items-center gap-12 py-16 md:grid-cols-[1.05fr_1fr] md:py-24">
          <div>
            <p className="eyebrow mb-5">Sổ ký ức gia đình</p>
            <h1 className="text-[2.7rem] leading-[1.08] sm:text-[3.6rem]">Mỗi gia đình,<br />một câu chuyện.</h1>
            <p className="mt-6 max-w-lg text-[1.15rem] text-stone">Nếp Nhà là cuốn sổ số của riêng gia đình bạn: nơi cả nhà cùng giữ lại ảnh, lời kể và những ngày bình thường đáng nhớ, để con cháu mở ra sau nhiều năm.</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link to="/register" className="btn">Tạo sổ gia đình</Link>
              <Link to="/login" className="btn-soft">Tôi đã có tài khoản</Link>
            </div>
            <p className="mt-5 text-[14.5px] text-stone">Miễn phí cho bản thử nghiệm. Không quảng cáo, không công khai nội dung.</p>
          </div>
          <figure>
            <img src="/demo/rainy-dinner.svg" alt="Hình minh hoạ: bữa cơm chiều ngày mưa của một gia đình" className="w-full rounded-[28px] border border-line shadow-[0_30px_60px_-30px_rgba(81,71,61,0.35)]" />
            <figcaption className="mt-3 text-center text-[13.5px] text-stone">Hình minh hoạ</figcaption>
          </figure>
        </section>

        <section id="cau-chuyen" className="border-y border-line bg-warm py-20">
          <div className="container-page mx-auto max-w-3xl text-center">
            <p className="eyebrow mb-4">Vì sao có Nếp Nhà</p>
            <h2 className="text-[2rem] sm:text-[2.5rem]">Ảnh nằm rải rác trong điện thoại. Chuyện cũ chỉ còn trong trí nhớ của ông bà.</h2>
            <p className="mt-6 text-[1.1rem] text-stone">Chúng ta chụp rất nhiều, nhưng ít khi ngồi lại kể. Những bữa cơm, chuyến về quê, câu chuyện tuổi trẻ của cha mẹ… nếu không được ghi lại sẽ mờ dần. Nếp Nhà giúp cả nhà cùng nhau giữ chúng ở một nơi, có ngày tháng, có lời kể, và chỉ dành cho người trong nhà.</p>
          </div>
        </section>

        <section id="tinh-nang" className="container-page py-20">
          <p className="eyebrow mb-4">Tính năng</p>
          <h2 className="mb-12 max-w-2xl text-[2rem] sm:text-[2.5rem]">Những gì một cuốn sổ gia đình cần có</h2>
          <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.t} className="border-t border-ink/70 pt-5">
                <h3 className="text-[1.35rem]">{f.t}</h3>
                <p className="mt-3 text-stone">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="cach-hoat-dong" className="border-y border-line bg-warm py-20">
          <div className="container-page">
            <p className="eyebrow mb-4">Cách hoạt động</p>
            <h2 className="mb-12 text-[2rem] sm:text-[2.5rem]">Ba bước để bắt đầu</h2>
            <ol className="grid gap-10 md:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="flex gap-5">
                  <span className="font-serif text-[3rem] leading-none text-moss" aria-hidden>{s.n}</span>
                  <div><h3 className="text-[1.3rem]">{s.t}</h3><p className="mt-2 text-stone">{s.d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="container-page py-20">
          <p className="eyebrow mb-4">Ví dụ một trang trong sổ</p>
          <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[26px] border border-line bg-warm md:grid-cols-2">
            <img src="/demo/first-day-school.svg" alt="Hình minh hoạ: ngày đầu tiên con đến trường" className="h-full w-full object-cover" />
            <div className="p-8 sm:p-10">
              <p className="eyebrow">5 tháng 9, 2024 · Tuổi thơ</p>
              <h3 className="mt-3 text-[1.9rem]">Ngày đầu tiên con đến trường</h3>
              <p className="mt-4 text-stone">Con đeo chiếc cặp còn thơm mùi mới, nắm chặt tay mẹ ở cổng trường. Đến lúc cô gọi tên, con quay lại vẫy tay thật nhanh rồi chạy vào lớp…</p>
              <p className="mt-6 text-[13.5px] text-stone">Nội dung mẫu hoàn toàn giả lập. Khi tạo sổ, bạn có thể thêm hoặc xoá dữ liệu mẫu bất cứ lúc nào.</p>
            </div>
          </div>
        </section>

        <section id="rieng-tu" className="border-t border-line bg-ink py-20 text-warm">
          <div className="container-page grid gap-10 md:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="eyebrow !text-[#c9d0bb]">Riêng tư</p>
              <h2 className="mt-3 text-[2rem] !text-warm sm:text-[2.5rem]">Không phải mạng xã hội.</h2>
              <p className="mt-5 text-[#d9d2c4]">Nội dung của gia đình không bao giờ công khai và không được dùng để huấn luyện AI.</p>
            </div>
            <ul className="space-y-4 text-[1.05rem] text-[#e9e3d6]">
              <li>• Mỗi gia đình là một không gian riêng; người ngoài không thể xem bằng cách đoán đường dẫn.</li>
              <li>• Quyền được kiểm tra ngay ở máy chủ cơ sở dữ liệu (luật bảo mật Firestore), không chỉ ẩn nút trên giao diện.</li>
              <li>• Ảnh được nén trên máy bạn rồi lưu trong cơ sở dữ liệu riêng của gia đình, không có đường dẫn công khai.</li>
              <li>• Bạn có thể tải dữ liệu của mình về và tự xoá tài khoản bất cứ lúc nào.</li>
            </ul>
          </div>
        </section>

        <section className="container-page py-24 text-center">
          <h2 className="mx-auto max-w-2xl text-[2.2rem] sm:text-[2.8rem]">Bắt đầu cuốn sổ của gia đình bạn hôm nay</h2>
          <p className="mx-auto mt-4 max-w-md text-stone">Ký ức nào cũng đáng được giữ lại, nhất là những điều tưởng như bình thường.</p>
          <div className="mt-8 flex justify-center"><Link to="/register" className="btn">Tạo sổ gia đình</Link></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

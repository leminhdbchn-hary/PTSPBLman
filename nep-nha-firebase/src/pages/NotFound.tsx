import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotFound({ inside }: { inside?: boolean }) {
  useEffect(() => { document.title = "Không tìm thấy · Nếp Nhà"; }, []);
  return (
    <div className={`mx-auto max-w-read text-center ${inside ? "py-10" : "px-5 py-24"}`}>
      <p className="eyebrow mb-3">404</p>
      <h1 className="text-[2.2rem]">Không tìm thấy trang này</h1>
      <p className="mb-7 mt-3 text-stone">Trang không tồn tại, đã bị xoá hoặc bạn không có quyền xem.</p>
      <Link to={inside ? "/family" : "/"} className="btn-soft">{inside ? "Về sổ gia đình" : "Về trang chủ"}</Link>
    </div>
  );
}

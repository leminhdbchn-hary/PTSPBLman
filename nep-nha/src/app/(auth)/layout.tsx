import { Logo, Notice } from "@/components/ui";
import { isConfigured } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container-page flex h-20 items-center"><Logo /></header>
      <main id="noi-dung" className="flex flex-1 items-start justify-center px-5 pb-20 pt-6 sm:pt-12">
        <div className="card w-full max-w-md p-7 sm:p-9">
          {!isConfigured() && (
            <div className="mb-6"><Notice kind="error">Website chưa được cấu hình Supabase nên chưa đăng nhập được. Xem hướng dẫn trong README (mục “Cấu hình Supabase”).</Notice></div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

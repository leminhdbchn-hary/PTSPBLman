import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Memo — Sổ ký ức gia đình", template: "%s · Memo" },
  description: "Mỗi gia đình, một câu chuyện. Nơi cả nhà cùng lưu giữ ảnh, lời kể và những ngày đáng nhớ trong một không gian riêng tư.",
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#F5F1E8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#noi-dung" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-warm">
          Bỏ qua, đến nội dung chính
        </a>
        {children}
      </body>
    </html>
  );
}

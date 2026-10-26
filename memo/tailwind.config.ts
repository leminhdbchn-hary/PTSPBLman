import type { Config } from "tailwindcss";

/**
 * Memo UI — Warm Minimalism. Mọi màu/phông của giao diện nằm ở đây (không viết mã màu thẳng trong thành phần).
 * Tương phản đã kiểm: ink/paper 9,4:1 · stone/paper 5,2:1 · moss/paper 5,2:1 · mossdark/cream 6,0:1.
 */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBFAF7", // nền trang (trắng kem)
        warm: "#FFFEFA", // mặt thẻ, ô nhập
        cream: "#F2EEE4", // khối nhấn ấm (hero, chip)
        ink: "#33483C", // xanh đậm: chữ chính, nút đậm
        stone: "#5E6E63", // chữ phụ
        moss: "#50725D", // xanh sage: nút, liên kết, điểm nhấn
        mossdark: "#3C6149", // sage đậm: chữ nhỏ trên nền kem
        sage: { DEFAULT: "#486B54", dark: "#345840", soft: "#E9F0E8", mist: "#DCE7DA" },
        line: "#E6E6DD",
        blush: { DEFAULT: "#C68F83", soft: "#EAC8BA" }, // hồng đất, dùng rất ít
        sun: "#E8C788",
        danger: { DEFAULT: "#8C3B25", bg: "#FBEEE8", line: "#E2B9AB", deep: "#7D3220" },
        success: { bg: "#EEF4EA", line: "#C5D3BD" },
        rec: "#B3402A", // nút ghi âm
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", '"Times New Roman"', "serif"],
        sans: ['"DM Sans"', '"Be Vietnam Pro"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      maxWidth: { page: "72rem", read: "42rem" },
      borderRadius: { "4xl": "2rem" },
      boxShadow: { soft: "0 8px 24px -12px rgba(51,72,60,0.28)", lift: "0 18px 40px -22px rgba(51,72,60,0.4)" },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        fade: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { rise: "rise .35s ease-out backwards", fade: "fade .3s ease-out backwards", shimmer: "shimmer 1.4s infinite" },
    },
  },
  plugins: [],
};
export default config;

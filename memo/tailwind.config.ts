import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F5F1E8", // kem giấy
        warm: "#FCFAF6", // trắng ấm
        ink: "#51473D", // nâu trầm
        stone: "#898176", // xám ấm
        moss: "#7A816D", // xanh rêu nhạt
        mossdark: "#5C6350", // xanh rêu đậm (chữ trên nền sáng, đủ tương phản)
        line: "#E4DCCB",
        rose: "#A8573F", // điểm nhấn đất nung, dùng rất ít
      },
      fontFamily: {
        serif: ['"Newsreader"', '"Playfair Display"', "Georgia", '"Times New Roman"', "serif"],
        sans: ['"Be Vietnam Pro"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      maxWidth: { page: "72rem", read: "42rem" },
    },
  },
  plugins: [],
};
export default config;

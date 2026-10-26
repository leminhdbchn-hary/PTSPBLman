/** Giới hạn và tiện ích ghi âm. Âm thanh lưu trong Firestore (mỗi tài liệu < 1 MB) nên phải ngắn và nén mạnh. */
export const AUDIO = {
  maxSeconds: 180,
  bitsPerSecond: 24_000, // đủ rõ cho giọng nói
  maxChars: 900_000, // độ dài tối đa của chuỗi data URL (luật bảo mật chặn ở 950.000)
} as const;

/** Chọn định dạng mà trình duyệt ghi được: Chrome/Android → webm (opus); Safari/iPhone → mp4 (AAC). */
export function pickMime(isSupported: (t: string) => boolean): string | undefined {
  for (const t of ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus", "audio/aac"]) if (isSupported(t)) return t;
  return undefined;
}

export type RecorderSupport = { ok: true } | { ok: false; reason: string };
export function recorderSupport(): RecorderSupport {
  if (typeof window === "undefined") return { ok: false, reason: "" };
  if (!window.isSecureContext) return { ok: false, reason: "Trình duyệt chỉ cho ghi âm trên trang https. Bạn mở web bằng địa chỉ https nhé." };
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    return { ok: false, reason: "Trình duyệt này chưa hỗ trợ ghi âm. Bạn thử Safari (iPhone) hoặc Chrome (Android, máy tính) bản mới nhé." };
  }
  return { ok: true };
}

/** Câu thông báo tiếng Việt cho lỗi xin quyền micro. */
export function micError(e: unknown): string {
  const name = (e as { name?: string })?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError") return "Mình chưa được phép dùng micro. Bạn bấm “Cho phép” khi trình duyệt hỏi; nếu lỡ chặn thì mở lại quyền micro trong cài đặt trình duyệt (biểu tượng ổ khoá cạnh địa chỉ) rồi thử lại.";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "Không tìm thấy micro trên thiết bị này. Bạn kiểm tra micro rồi thử lại nhé.";
  if (name === "NotReadableError") return "Micro đang được ứng dụng khác dùng. Bạn tắt ứng dụng đó rồi thử lại nhé.";
  return "Chưa bật được micro. Bạn thử lại nhé.";
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(b);
  });
}

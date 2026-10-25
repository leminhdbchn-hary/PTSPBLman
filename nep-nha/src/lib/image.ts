import { EXT_BY_MIME, MEDIA_LIMITS } from "./validation";

export type Prepared = { blob: Blob; mime: string; width: number | null; height: number | null; name: string };

export function checkFile(file: File): string | null {
  if (!(MEDIA_LIMITS.mimes as readonly string[]).includes(file.type)) return `“${file.name}” không phải ảnh được hỗ trợ (JPG, PNG, WebP, HEIC, GIF).`;
  if (file.size > MEDIA_LIMITS.maxBytes) return `“${file.name}” lớn hơn ${MEDIA_LIMITS.maxBytes / 1024 / 1024} MB.`;
  return null;
}

/** Thu nhỏ ảnh lớn ngay trên máy (tối đa 2400 px) để tải lên nhanh trên điện thoại. HEIC/GIF giữ nguyên nếu trình duyệt không đọc được. */
export async function prepareImage(file: File, maxSide = 2400): Promise<Prepared> {
  const keep = (w: number | null = null, h: number | null = null): Prepared => ({ blob: file, mime: file.type, width: w, height: h, name: file.name });
  if (file.type === "image/gif") return keep();
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= 2 * 1024 * 1024 && file.type !== "image/heic" && file.type !== "image/heif") {
      const r = keep(bmp.width, bmp.height);
      bmp.close();
      return r;
    }
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const g = canvas.getContext("2d");
    if (!g) { bmp.close(); return keep(bmp.width, bmp.height); }
    g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
    g.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.86));
    if (!blob) return keep(w, h);
    return { blob, mime: "image/jpeg", width: w, height: h, name: file.name.replace(/\.[^.]+$/, "") + ".jpg" };
  } catch {
    return keep(); // ví dụ HEIC trên trình duyệt không giải mã được: tải nguyên bản (Storage nhận image/heic)
  }
}

export const extFor = (mime: string) => EXT_BY_MIME[mime] ?? "jpg";

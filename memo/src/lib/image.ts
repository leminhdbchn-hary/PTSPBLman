import { MEDIA_LIMITS } from "./validation";

export type PreparedImage = { data: string; w: number; h: number };

const EXT_MIME: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", jpe: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif", gif: "image/gif" };

/** Một số máy (thư viện ảnh Android, Windows) trả về tệp ảnh với kiểu rỗng: đoán theo đuôi tệp. */
export function mimeOf(file: File): string {
  if (file.type) return file.type.toLowerCase();
  return EXT_MIME[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "";
}

export function checkFile(file: File): string | null {
  if (!(MEDIA_LIMITS.inputMimes as readonly string[]).includes(mimeOf(file))) return `“${file.name}” không phải ảnh được hỗ trợ (JPG, PNG, WebP, HEIC, GIF).`;
  if (file.size > MEDIA_LIMITS.maxInputBytes) return `“${file.name}” lớn hơn ${MEDIA_LIMITS.maxInputBytes / 1024 / 1024} MB.`;
  return null;
}

/**
 * Nén ảnh ngay trên máy thành JPEG vừa với một tài liệu Firestore (< ~950.000 ký tự).
 * Đọc ảnh qua thẻ <img> nên tự xoay đúng chiều (EXIF) trên cả iPhone. Bắt đầu 1600 px / chất lượng 0,82, nhỏ dần nếu vẫn quá lớn.
 */
export async function prepareImage(file: File, maxSide = 1600): Promise<PreparedImage> {
  let base: HTMLCanvasElement;
  try {
    base = await toCanvas(file, maxSide);
  } catch {
    throw new Error(`Trình duyệt này chưa đọc được ảnh “${file.name}”. Bạn thử chuyển sang JPG rồi tải lại nhé.`);
  }
  const tries: [number, number][] = [[1, 0.82], [1, 0.7], [0.8, 0.72], [0.64, 0.7], [0.5, 0.65]];
  for (const [k, q] of tries) {
    let c = base;
    if (k < 1) {
      c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(base.width * k)); c.height = Math.max(1, Math.round(base.height * k));
      c.getContext("2d")!.drawImage(base, 0, 0, c.width, c.height);
    }
    const data = c.toDataURL("image/jpeg", q);
    if (data.length <= MEDIA_LIMITS.maxStoredChars) return { data, w: c.width, h: c.height };
  }
  throw new Error(`Ảnh “${file.name}” quá lớn sau khi nén.`);
}

/** Ảnh nhỏ (ảnh bìa trên dòng thời gian, ảnh đại diện) ~ 480 px, vài chục KB. */
export async function thumbnailFrom(dataUrlOrFile: string | File, maxSide = 480): Promise<string> {
  const blob = typeof dataUrlOrFile === "string" ? await (await fetch(dataUrlOrFile)).blob() : dataUrlOrFile;
  const file = blob instanceof File ? blob : new File([blob], "anh", { type: blob.type });
  const src = await toCanvas(file, maxSide);
  let q = 0.75, k = 1;
  let out = src.toDataURL("image/jpeg", q);
  while (out.length > 140_000 && q > 0.4) {
    q -= 0.1; k *= 0.9;
    const c = document.createElement("canvas");
    c.width = Math.round(src.width * k); c.height = Math.round(src.height * k);
    c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
    out = c.toDataURL("image/jpeg", q);
  }
  return out;
}

/** Đọc ảnh qua thẻ <img> (tự xoay đúng chiều theo EXIF trên mọi trình duyệt hiện đại, kể cả iPhone). */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("decode"));
    img.src = src;
  });
}

/** Thu ảnh về tối đa `maxSide` px (giữ đúng chiều) và trả về canvas. */
export async function toCanvas(file: File, maxSide = 1600): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * scale));
    c.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const g = c.getContext("2d");
    if (!g) throw new Error("canvas");
    g.fillStyle = "#fff";
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function rotateCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.height;
  c.height = src.width;
  const g = c.getContext("2d")!;
  g.translate(c.width / 2, c.height / 2);
  g.rotate(Math.PI / 2);
  g.drawImage(src, -src.width / 2, -src.height / 2);
  return c;
}

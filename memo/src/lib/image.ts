import { MEDIA_LIMITS } from "./validation";

export type PreparedImage = { data: string; w: number; h: number };

export function checkFile(file: File): string | null {
  if (!(MEDIA_LIMITS.inputMimes as readonly string[]).includes(file.type)) return `“${file.name}” không phải ảnh được hỗ trợ (JPG, PNG, WebP, HEIC, GIF).`;
  if (file.size > MEDIA_LIMITS.maxInputBytes) return `“${file.name}” lớn hơn ${MEDIA_LIMITS.maxInputBytes / 1024 / 1024} MB.`;
  return null;
}

async function draw(src: ImageBitmap, maxSide: number, quality: number): Promise<PreparedImage> {
  const scale = Math.min(1, maxSide / Math.max(src.width, src.height));
  const w = Math.max(1, Math.round(src.width * scale)), h = Math.max(1, Math.round(src.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("canvas");
  g.fillStyle = "#fff";
  g.fillRect(0, 0, w, h);
  g.drawImage(src, 0, 0, w, h);
  return { data: canvas.toDataURL("image/jpeg", quality), w, h };
}

/**
 * Nén ảnh ngay trên máy thành JPEG vừa với một tài liệu Firestore (< ~950.000 ký tự).
 * Bắt đầu 1600 px / chất lượng 0,82, nhỏ dần nếu vẫn quá lớn.
 */
export async function prepareImage(file: File, maxSide = 1600): Promise<PreparedImage> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new Error(`Trình duyệt này chưa đọc được ảnh “${file.name}”. Bạn thử chuyển sang JPG rồi tải lại nhé.`);
  }
  try {
    const tries: [number, number][] = [[maxSide, 0.82], [maxSide, 0.7], [1280, 0.72], [1024, 0.7], [800, 0.65]];
    for (const [side, q] of tries) {
      const r = await draw(bmp, side, q);
      if (r.data.length <= MEDIA_LIMITS.maxStoredChars) return r;
    }
    throw new Error(`Ảnh “${file.name}” quá lớn sau khi nén.`);
  } finally {
    bmp.close();
  }
}

/** Ảnh nhỏ (ảnh bìa trên dòng thời gian, ảnh đại diện) ~ 480 px, vài chục KB. */
export async function thumbnailFrom(dataUrlOrFile: string | File, maxSide = 480): Promise<string> {
  const blob = typeof dataUrlOrFile === "string" ? await (await fetch(dataUrlOrFile)).blob() : dataUrlOrFile;
  const bmp = await createImageBitmap(blob);
  try {
    let q = 0.75;
    let r = await draw(bmp, maxSide, q);
    while (r.data.length > 140_000 && q > 0.4) { q -= 0.1; r = await draw(bmp, maxSide * 0.85, q); }
    return r.data;
  } finally {
    bmp.close();
  }
}

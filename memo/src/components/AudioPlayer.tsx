import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/audio";

/**
 * Trình phát đoạn ghi âm. Tệp ghi bằng MediaRecorder (webm) thường không có độ dài khi mới mở:
 * thủ thuật nhảy tới cuối giúp trình duyệt tính ra độ dài thật, nên hiện sẵn số giây đã lưu cho dễ nhìn.
 */
export function AudioPlayer({ src, seconds, autoPlay, label }: { src: string; seconds: number; autoPlay?: boolean; label: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [fixing, setFixing] = useState(false);
  useEffect(() => { if (autoPlay) ref.current?.play().catch(() => {}); }, [autoPlay, src]);
  return (
    <div className="flex items-center gap-3">
      <audio
        ref={ref} src={src} controls preload="metadata" aria-label={label} className="h-12 w-full min-w-0"
        onLoadedMetadata={(e) => {
          const a = e.currentTarget;
          if (a.duration === Infinity) { setFixing(true); a.currentTime = 1e101; }
        }}
        onTimeUpdate={(e) => { const a = e.currentTarget; if (fixing && Number.isFinite(a.duration)) { a.currentTime = 0; setFixing(false); } }}
      />
      <span className="shrink-0 text-[14px] tabular-nums text-stone" aria-hidden>{formatDuration(seconds)}</span>
    </div>
  );
}

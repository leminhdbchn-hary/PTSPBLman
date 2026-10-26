import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Avatar, ConfirmButton, EmptyState, LinkBtn, Loading, Notice, PageTitle } from "@/components/ui";
import { AudioPlayer } from "@/components/AudioPlayer";
import { useAsync, useFamily } from "@/lib/session";
import { deleteStory, friendlyError, getStoryAudio, listPeople, listStories, saveStory } from "@/lib/data";
import { AUDIO, blobToDataUrl, formatDuration, micError, pickMime, recorderSupport } from "@/lib/audio";
import { formatDateTime } from "@/lib/utils";
import type { Story } from "@/lib/types";

export const PROMPTS = [
  "Ông bà gặp nhau như thế nào?",
  "Tuổi thơ của cha mẹ ra sao?",
  "Kỷ niệm nào khiến gia đình tự hào nhất?",
  "Điều gì ông bà muốn truyền lại cho con cháu?",
  "Bài học quan trọng nhất trong cuộc đời là gì?",
  "Món ăn nào gợi nhớ nhà nhất?",
];

function StoryCard({ s, onDelete, canDelete }: { s: Story; onDelete: () => Promise<void>; canDelete: boolean }) {
  const ctx = useFamily();
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function load() {
    setBusy(true); setErr(null);
    try {
      const data = await getStoryAudio(ctx, s.id);
      if (!data) setErr("Không tìm thấy đoạn ghi âm này.");
      else setSrc(data);
    } catch (x) { setErr(friendlyError(x, "Chưa tải được đoạn ghi âm.")); }
    setBusy(false);
  }
  return (
    <li className="card p-5">
      <div className="flex items-start gap-4">
        <Avatar name={s.personName} size={52} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[1.25rem] leading-snug">{s.title}</h3>
          <p className="mt-1 text-[14.5px] text-stone">{s.personName} kể · {formatDuration(s.seconds)}{s.createdAt ? ` · ghi ngày ${formatDateTime(s.createdAt)}` : ""}</p>
        </div>
      </div>
      <div className="mt-4">
        {src ? <AudioPlayer src={src} seconds={s.seconds} autoPlay label={`Lời kể: ${s.title}`} /> : (
          <button type="button" className="btn w-full sm:w-auto" onClick={load} disabled={busy} aria-label={`Nghe lời kể: ${s.title}`}>
            {busy ? "Đang tải…" : "▶ Nghe lời kể"}
          </button>
        )}
        {err && <div className="mt-3"><Notice kind="error">{err}</Notice></div>}
      </div>
      {canDelete && <div className="mt-3"><ConfirmButton label="Xoá" className="tap text-[14.5px] text-stone underline" question={`Xoá lời kể “${s.title}”?`} confirmLabel="Xoá lời kể" onConfirm={onDelete} /></div>}
    </li>
  );
}

export function StoriesPage() {
  const ctx = useFamily();
  const [err, setErr] = useState<string | null>(null);
  const { data, loading, error, reload } = useAsync(() => listStories(ctx), [ctx.fid]);
  if (loading && !data) return <Loading />;
  if (error || !data) return <Notice kind="error">{friendlyError(error)}</Notice>;
  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle eyebrow="Giọng nói của người thân" title="Lời kể">
        {ctx.canWrite && <LinkBtn to="/family/stories/new">🎙 Ghi âm lời kể</LinkBtn>}
      </PageTitle>
      <p className="mb-8 max-w-read text-[1.05rem] text-stone">Giọng kể của ông bà, cha mẹ là điều khó thay thế nhất. Hãy ghi lại ngay hôm nay, nghe lại bất cứ khi nào nhớ.</p>
      {err && <div className="mb-6"><Notice kind="error">{err}</Notice></div>}
      {data.length === 0 ? (
        <EmptyState title="Chưa có lời kể nào" action={ctx.canWrite ? <LinkBtn to="/family/stories/new">🎙 Ghi âm lời kể đầu tiên</LinkBtn> : undefined}>
          Chọn một câu hỏi gợi ý, bấm ghi âm và để người thân kể. Mỗi đoạn tối đa {AUDIO.maxSeconds / 60} phút.
        </EmptyState>
      ) : (
        <ul className="space-y-4">
          {data.map((s) => (
            <StoryCard key={s.id} s={s} canDelete={ctx.isAdmin || s.createdBy === ctx.user.uid}
              onDelete={async () => { try { await deleteStory(ctx, s.id); reload(); } catch (x) { setErr(friendlyError(x)); } }} />
          ))}
        </ul>
      )}
      {ctx.canWrite && data.length > 0 && <p className="mt-10 text-center text-[14.5px] text-stone">Cần gợi ý? <Link to="/family/stories/new" className="underline">Xem các câu hỏi</Link> để mở lời với người thân.</p>}
    </div>
  );
}

type Phase = "idle" | "recording" | "paused" | "done";

export function NewStoryPage() {
  const ctx = useFamily();
  const nav = useNavigate();
  const people = useAsync(() => listPeople(ctx), [ctx.fid]);
  const [title, setTitle] = useState("");
  const [who, setWho] = useState(""); // id hồ sơ, "" = chưa chọn, "other" = gõ tên
  const [otherName, setOtherName] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [seconds, setSeconds] = useState(0);
  const support = useRef(recorderSupport());
  const [err, setErr] = useState<string | null>(() => { const sp = recorderSupport(); return sp.ok ? null : sp.reason; });
  const [saving, setSaving] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);
  const started = useRef(0); // mốc tính giờ, trừ thời gian tạm dừng
  const acc = useRef(0);
  const wake = useRef<{ release(): Promise<void> } | null>(null);

  const stopTimer = () => { if (timer.current) window.clearInterval(timer.current); timer.current = null; };
  const cleanupStream = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; wake.current?.release().catch(() => {}); wake.current = null; };
  useEffect(() => () => { stopTimer(); cleanupStream(); if (rec.current && rec.current.state !== "inactive") { try { rec.current.stop(); } catch { /* đã dừng */ } } }, []);
  useEffect(() => { document.title = "Ghi âm lời kể · Memo"; }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  if (!ctx.canWrite) return <Navigate to="/family/stories" replace />;

  const speaker = who === "other" ? otherName.trim() : people.data?.find((p) => p.id === who)?.fullName ?? "";

  async function start() {
    setErr(null);
    const sup = support.current;
    if (!sup.ok) { setErr(sup.reason); return; }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current = st;
      const mime = pickMime((t) => MediaRecorder.isTypeSupported(t));
      const mr = new MediaRecorder(st, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: AUDIO.bitsPerSecond });
      chunks.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      mr.onstop = () => {
        stopTimer(); cleanupStream();
        const b = new Blob(chunks.current, { type: mr.mimeType || mime || "audio/webm" });
        const secs = Math.max(1, Math.round(acc.current / 1000));
        if (!b.size) { setErr("Chưa thu được âm thanh nào. Bạn thử ghi lại nhé."); setPhase("idle"); return; }
        setBlob(b); setSeconds(secs); setUrl(URL.createObjectURL(b)); setPhase("done");
      };
      mr.onerror = () => { setErr("Có lỗi khi ghi âm. Bạn thử lại nhé."); stopTimer(); cleanupStream(); setPhase("idle"); };
      rec.current = mr;
      acc.current = 0; started.current = Date.now(); setElapsed(0);
      mr.start(1000);
      setPhase("recording");
      // giữ màn hình sáng khi đang ghi (nếu trình duyệt cho phép)
      (navigator as unknown as { wakeLock?: { request(t: "screen"): Promise<{ release(): Promise<void> }> } }).wakeLock?.request("screen").then((w) => { wake.current = w; }).catch(() => {});
      timer.current = window.setInterval(() => {
        if (rec.current?.state !== "recording") return; // đang tạm dừng: đồng hồ đứng yên
        const total = acc.current + (Date.now() - started.current);
        setElapsed(total / 1000);
        if (total / 1000 >= AUDIO.maxSeconds) { acc.current = AUDIO.maxSeconds * 1000; stop(true); }
      }, 250);
    } catch (e) {
      cleanupStream();
      setErr(micError(e));
    }
  }
  function pause() { const mr = rec.current; if (!mr || mr.state !== "recording") return; mr.pause(); acc.current += Date.now() - started.current; setPhase("paused"); setElapsed(acc.current / 1000); }
  function resume() { const mr = rec.current; if (!mr || mr.state !== "paused") return; mr.resume(); started.current = Date.now(); setPhase("recording"); }
  function stop(auto = false) {
    const mr = rec.current;
    if (!mr || mr.state === "inactive") return;
    if (!auto && mr.state === "recording") acc.current += Date.now() - started.current;
    stopTimer();
    mr.stop();
    if (auto) setErr(`Đã đủ ${AUDIO.maxSeconds / 60} phút nên mình tự dừng. Bạn có thể ghi tiếp thành một đoạn mới.`);
  }
  function redo() { if (url) URL.revokeObjectURL(url); setBlob(null); setUrl(""); setPhase("idle"); setElapsed(0); setErr(null); }

  async function save() {
    if (!blob) return;
    if (!speaker) { setErr("Bạn chọn hoặc gõ tên người kể nhé."); return; }
    const t = title.trim() || `Lời kể của ${speaker}`;
    setSaving(true); setErr(null);
    try {
      const audio = await blobToDataUrl(blob);
      if (audio.length > AUDIO.maxChars) throw new Error("big");
      await saveStory(ctx, { title: t.slice(0, 140), personId: who && who !== "other" ? who : null, personName: speaker.slice(0, 100), seconds, mime: blob.type.split(";")[0] || "audio/webm", audio });
      nav("/family/stories", { replace: true });
    } catch (x) {
      setSaving(false);
      setErr(x instanceof Error && x.message === "big" ? "Đoạn ghi âm quá dài để lưu. Bạn ghi ngắn lại (dưới 3 phút) nhé." : friendlyError(x, "Chưa lưu được lời kể. Bạn thử lại nhé."));
    }
  }

  const recording = phase === "recording" || phase === "paused";
  const canStart = support.current.ok;
  return (
    <div className="mx-auto max-w-read pb-28">
      <PageTitle eyebrow="Ghi âm" title="Ghi âm lời kể" />
      {err && <div className="mb-6"><Notice kind={err.startsWith("Đã đủ") ? "info" : "error"}>{err}</Notice></div>}

      {phase !== "done" && (
        <section aria-labelledby="g-y" className="mb-6">
          <h2 id="g-y" className="label">Cần gợi ý? Chọn một câu hỏi để người thân kể <span className="font-normal text-stone">(không bắt buộc)</span></h2>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {PROMPTS.map((p) => (
              <button key={p} type="button" aria-pressed={title === p} disabled={recording} onClick={() => setTitle(title === p ? "" : p)}
                className={`tap shrink-0 whitespace-nowrap rounded-full border px-4 text-[15px] ${title === p ? "border-ink bg-ink text-warm" : "border-line bg-warm text-ink"}`}>{p}</button>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="g-ghi" className="card flex flex-col items-center gap-5 px-5 py-8 text-center">
        <h2 id="g-ghi" className="sr-only">Ghi âm</h2>
        {phase === "done" && url ? (
          <>
            <p className="font-serif text-[1.3rem]">Nghe lại trước khi lưu</p>
            <div className="w-full"><AudioPlayer src={url} seconds={seconds} label="Nghe lại đoạn vừa ghi" /></div>
            <p className="text-[14.5px] text-stone">Dài {formatDuration(seconds)}</p>
          </>
        ) : (
          <>
            {title && <p className="max-w-sm font-serif text-[1.35rem] leading-snug">“{title}”</p>}
            <p className="text-[2.6rem] font-light tabular-nums" role="timer" aria-live="off" data-testid="timer">{formatDuration(elapsed)}<span className="text-[1.1rem] text-stone"> / {formatDuration(AUDIO.maxSeconds)}</span></p>
            {phase === "idle" && (
              <button type="button" onClick={start} aria-label="Bắt đầu ghi âm" disabled={!canStart}
                className="grid h-24 w-24 place-items-center rounded-full bg-[#b3402a] text-warm shadow-lg active:scale-95 disabled:opacity-40">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 15a3.5 3.5 0 0 0 3.5-3.5v-6a3.5 3.5 0 0 0-7 0v6A3.5 3.5 0 0 0 12 15zm6-3.5a.9.9 0 0 0-1.8 0 4.2 4.2 0 0 1-8.4 0 .9.9 0 0 0-1.8 0 6 6 0 0 0 5.1 5.9V20H9.5a.9.9 0 0 0 0 1.8h5a.9.9 0 0 0 0-1.8h-1.9v-2.6a6 6 0 0 0 5.4-5.9z" /></svg>
              </button>
            )}
            {recording && (
              <div className="flex items-center gap-4">
                {phase === "recording"
                  ? <button type="button" className="btn-soft" onClick={pause}>⏸ Tạm dừng</button>
                  : <button type="button" className="btn-soft" onClick={resume}>● Ghi tiếp</button>}
                <button type="button" onClick={() => stop()} aria-label="Dừng và nghe lại" className="grid h-20 w-20 place-items-center rounded-full bg-ink text-warm shadow-lg">
                  <span className="h-6 w-6 rounded-sm bg-warm" aria-hidden />
                </button>
              </div>
            )}
            <p className="max-w-xs text-[15px] text-stone" role="status">
              {phase === "idle" && "Bấm nút đỏ để bắt đầu. Bạn nói gần micro, chỗ yên tĩnh sẽ rõ hơn."}
              {phase === "recording" && <><span className="mr-1.5 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-[#b3402a]" aria-hidden />Đang ghi âm… bấm ô vuông để dừng.</>}
              {phase === "paused" && "Đã tạm dừng. Bấm “Ghi tiếp” hoặc ô vuông để dừng."}
            </p>
          </>
        )}
      </section>

      {phase === "done" && (
        <section aria-labelledby="g-luu" className="mt-8 space-y-6">
          <h2 id="g-luu" className="sr-only">Thông tin lời kể</h2>
          <div>
            <label htmlFor="s-who" className="label !text-[17px]">Ai đang kể?</label>
            <select id="s-who" className="input" value={who} onChange={(e) => setWho(e.target.value)} disabled={saving}>
              <option value="">Chọn người kể…</option>
              {(people.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.fullName}{p.relationLabel ? ` (${p.relationLabel})` : ""}</option>)}
              <option value="other">Người khác (gõ tên)…</option>
            </select>
            {who === "other" && <input aria-label="Tên người kể" className="input mt-3" value={otherName} onChange={(e) => setOtherName(e.target.value)} maxLength={100} placeholder="Tên người kể" disabled={saving} />}
          </div>
          <div>
            <label htmlFor="s-title" className="label !text-[17px]">Tên lời kể <span className="font-normal text-stone">(để trống, mình tự đặt)</span></label>
            <input id="s-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} disabled={saving} placeholder={speaker ? `Lời kể của ${speaker}` : "VD: Ông kể chuyện ngày xưa đi học"} />
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="container-page flex max-w-read items-center gap-3 py-3">
          <button type="button" className="btn-soft shrink-0" disabled={saving || recording} onClick={() => nav(-1)}>Huỷ</button>
          {phase === "done"
            ? <><button type="button" className="btn-soft shrink-0" disabled={saving} onClick={redo}>Ghi lại</button><button type="button" className="btn flex-1" disabled={saving} aria-busy={saving} onClick={save}>{saving ? "Đang lưu…" : "Lưu lời kể"}</button></>
            : <p className="flex-1 text-center text-[14.5px] text-stone">{recording ? "Đang ghi âm…" : "Ghi xong sẽ được nghe lại trước khi lưu"}</p>}
        </div>
      </div>
    </div>
  );
}

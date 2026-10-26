import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User as FbUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebase, type FB } from "./firebase";
import { listMyFamilies, type Ctx, type User } from "./data";
import type { MyFamily } from "./types";

const ACTIVE_KEY = "nn_family";

type Session = {
  fb: FB | null;
  error: string | null;
  loading: boolean;
  fbUser: FbUser | null;
  user: User | null;
  families: MyFamily[];
  active: MyFamily | null;
  setActive: (id: string) => void;
  refresh: () => Promise<MyFamily[]>;
  setName: (name: string) => void;
};
const SessionCtx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [fb, setFb] = useState<FB | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fbUser, setFbUser] = useState<FbUser | null>(null);
  const [name, setNameState] = useState<string>("");
  const [override, setOverride] = useState<{ uid: string; name: string } | null>(null);
  const [families, setFamilies] = useState<MyFamily[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => { try { return localStorage.getItem(ACTIVE_KEY); } catch { return null; } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    firebase().then((f) => {
      setFb(f);
      unsub = onAuthStateChanged(f.auth, async (u) => {
        setLoading(true);
        setFbUser(u);
        if (u) {
          const prof = await getDoc(doc(f.db, "nn_users", u.uid)).catch(() => null);
          setNameState(String(prof?.data()?.fullName ?? u.displayName ?? u.email ?? "Bạn"));
          setFamilies(await listMyFamilies(f.db, u.uid).catch(() => []));
        } else {
          setFamilies([]);
          setNameState("");
        }
        setLoading(false);
      });
    }).catch((e) => { setError(String(e?.message ?? e)); setLoading(false); });
    return () => unsub();
  }, []);

  const user: User | null = useMemo(() => {
    if (!fbUser) return null;
    const n = override?.uid === fbUser.uid ? override.name : name || fbUser.displayName || "Bạn";
    return { uid: fbUser.uid, email: fbUser.email ?? "", name: n };
  }, [fbUser, name, override]);
  const active = families.find((f) => f.id === activeId) ?? families[0] ?? null;

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    try { localStorage.setItem(ACTIVE_KEY, id); } catch { /* không lưu được cũng không sao */ }
  }, []);
  const refresh = useCallback(async () => {
    if (!fb || !fbUser) return [];
    const list = await listMyFamilies(fb.db, fbUser.uid);
    setFamilies(list);
    return list;
  }, [fb, fbUser]);

  const setName = useCallback((n: string) => { const u = fb?.auth.currentUser; if (u) setOverride({ uid: u.uid, name: n }); }, [fb]);
  const value: Session = { fb, error, loading, fbUser, user, families, active, setActive, refresh, setName };
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): Session {
  const s = useContext(SessionCtx);
  if (!s) throw new Error("SessionProvider");
  return s;
}

/** Ngữ cảnh gia đình đang mở (chỉ dùng trong các trang /family/*). */
export function useFamily(): Ctx & { familyName: string; canWrite: boolean; isAdmin: boolean; isOwner: boolean } {
  const s = useSession();
  if (!s.fb || !s.user || !s.active) throw new Error("useFamily ngoài khu vực gia đình");
  const role = s.active.role;
  return { db: s.fb.db, user: s.user, fid: s.active.id, role, familyName: s.active.name, canWrite: role !== "viewer", isAdmin: role === "owner" || role === "admin", isOwner: role === "owner" };
}

/** Gọi hàm bất đồng bộ, theo dõi trạng thái tải/lỗi; reload() để tải lại. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: unknown; loading: boolean }>({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    fn().then((data) => alive && setState({ data, error: null, loading: false }), (error) => alive && setState({ data: null, error, loading: false }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

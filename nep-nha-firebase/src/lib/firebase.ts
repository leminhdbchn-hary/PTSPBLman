import { initializeApp, type FirebaseOptions } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore, type Firestore } from "firebase/firestore";

const useEmulators = import.meta.env.VITE_USE_EMULATORS === "1";

/**
 * Cấu hình Firebase: ưu tiên biến môi trường VITE_FIREBASE_*; nếu không có thì đọc /__/firebase/init.json
 * (Firebase Hosting tự phục vụ tệp này cho đúng dự án), nên bản deploy không cần nhúng khoá vào mã.
 */
async function loadConfig(): Promise<FirebaseOptions> {
  if (useEmulators) return { apiKey: "demo-key", projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-nepnha", authDomain: "localhost" };
  const env = import.meta.env;
  if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
    return { apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID };
  }
  const r = await fetch("/__/firebase/init.json");
  if (!r.ok) throw new Error("Chưa cấu hình Firebase");
  return (await r.json()) as FirebaseOptions;
}

export type FB = { auth: Auth; db: Firestore };
let ready: Promise<FB> | null = null;

export function firebase(): Promise<FB> {
  if (!ready) {
    ready = loadConfig().then((cfg) => {
      const app = initializeApp(cfg);
      const auth = getAuth(app);
      auth.languageCode = "vi";
      const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
      if (useEmulators) {
        const host = import.meta.env.VITE_EMULATOR_HOST || "127.0.0.1";
        connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
        connectFirestoreEmulator(db, host, 8080);
      }
      return { auth, db };
    });
  }
  return ready;
}

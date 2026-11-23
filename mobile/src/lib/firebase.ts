import { Platform } from "react-native";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Must match REGION in functions/src/config.ts */
export const FUNCTIONS_REGION = "asia-southeast1";

const env = process.env;

/** Mock mode = no Firebase keys, or forced on. All services then use in-memory fake data. */
export const USE_MOCK = !env.EXPO_PUBLIC_FIREBASE_API_KEY || env.EXPO_PUBLIC_USE_MOCK === "true";
const USE_EMULATOR = env.EXPO_PUBLIC_USE_EMULATOR === "true";
const EMULATOR_HOST = env.EXPO_PUBLIC_EMULATOR_HOST ?? "localhost";

function init() {
  if (getApps().length > 0) return getApp();
  return initializeApp({
    apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
  });
}

/** Lazily created so mock mode never touches Firebase. */
let cached: ReturnType<typeof build> | null = null;

function build() {
  const fresh = getApps().length === 0;
  const app = init();
  const auth =
    Platform.OS === "web" || !fresh
      ? getAuth(app)
      : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  const db = getFirestore(app);
  const functions = getFunctions(app, FUNCTIONS_REGION);

  if (USE_EMULATOR && fresh) {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
    connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
  }
  return { app, auth, db, functions };
}

export function firebase() {
  if (!cached) cached = build();
  return cached;
}

// Firebase exports getReactNativePersistence at runtime on React Native (via the "react-native"
// package condition), but TypeScript's default resolution doesn't see it. This declares it.
import type { Persistence } from "firebase/auth";

declare module "firebase/auth" {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}

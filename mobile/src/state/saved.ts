import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Bookmarked trail ids, remembered on the device (not in Firebase; swap to Firestore later if you want it synced). */
const KEY = "akyat.saved";
let ids: string[] = [];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

AsyncStorage.getItem(KEY)
  .then((raw) => {
    if (raw) {
      ids = JSON.parse(raw);
      emit();
    }
  })
  .catch(() => {});

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function toggleSaved(trailId: string) {
  ids = ids.includes(trailId) ? ids.filter((i) => i !== trailId) : [...ids, trailId];
  emit();
  AsyncStorage.setItem(KEY, JSON.stringify(ids)).catch(() => {});
}

export function useSaved() {
  const current = useSyncExternalStore(subscribe, () => ids);
  return { ids: current, isSaved: (id: string) => current.includes(id), toggle: toggleSaved };
}

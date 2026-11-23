import * as Haptics from "expo-haptics";

/** Tiny vibration on iPhone/Android. Silently does nothing where unsupported (web, simulators). */
export const tap = () => {
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {
    /* ignore */
  }
};

export const success = () => {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {
    /* ignore */
  }
};

export const warn = () => {
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  } catch {
    /* ignore */
  }
};

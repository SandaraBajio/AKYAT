import { StyleSheet } from "react-native";
import type { BookingStatus, Difficulty } from "./types";

/**
 * Palette from the reference (deep forest greens + a pale mint).
 *   #051F20  #0B2B26  #163832  #235347  #8EB69B  #DAF1DE
 */
export const colors = {
  bg: "#051F20", // screen background
  surface: "#0B2B26", // cards
  surface2: "#163832", // inputs, raised pills
  line: "#235347", // borders, dividers
  accent: "#8EB69B", // active states, highlights
  light: "#DAF1DE", // primary text, primary buttons
  text: "#DAF1DE",
  muted: "#86AB95", // secondary text
  onLight: "#051F20", // text on top of light/accent fills
  white: "#FFFFFF",
  danger: "#E5604D",
  star: "#F2C14E",
  marker: "#F28C28", // map markers (from the map reference)
  route: "#7EF0A9", // bright route line on dark maps
  glass: "rgba(11,43,38,0.72)",
};

/** Outfit (loaded in app/_layout.tsx). One family per weight, because custom fonts ignore fontWeight. */
export const font = {
  regular: "Outfit_400Regular",
  medium: "Outfit_500Medium",
  semi: "Outfit_600SemiBold",
  bold: "Outfit_700Bold",
  black: "Outfit_800ExtraBold",
};

export const radius = { card: 24, pill: 999, button: 18, input: 16 };

/** Space kept free at the bottom of tab screens so content isn't hidden behind the floating tab bar. */
export const TAB_BAR_SPACE = 110;

export const difficultyStyle: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: "Easy", color: "#8EF0B0" },
  moderate: { label: "Moderate", color: "#F2C14E" },
  hard: { label: "Hard", color: "#F2866B" },
};

export const statusLabel: Record<BookingStatus, { text: string; color: string }> = {
  pending_payment: { text: "Waiting for payment", color: "#F2C14E" },
  confirmed: { text: "Confirmed", color: "#7EF0A9" },
  paid_unassigned: { text: "Paid, assigning guide", color: "#F2C14E" },
  cancelled: { text: "Cancelled", color: "#F2866B" },
  completed: { text: "Completed", color: "#8EB69B" },
};

/** Money is stored in centavos. 35000 -> "₱350.00" */
export function peso(centavos: number): string {
  return "₱" + (centavos / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "YYYY-MM-DD" for a Date, using the local calendar day. */
export function toDateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export const shared = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: "row", alignItems: "center" },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.surface2,
    padding: 16,
  },
});

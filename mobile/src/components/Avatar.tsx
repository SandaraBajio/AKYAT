import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, View } from "react-native";
import { colors, font } from "../theme";
import { T } from "./T";

const TINTS: [string, string][] = [
  ["#235347", "#8EB69B"],
  ["#163832", "#6FA68A"],
  ["#2C6B58", "#B6D8C2"],
  ["#1B4A3D", "#8EB69B"],
];

function tint(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

interface Props {
  name: string;
  uri?: string;
  size?: number;
  /** "new" = unseen story ring, "seen" = dim ring. Leave out for no ring. */
  ring?: "new" | "seen";
}

/** Round avatar. Shows the photo if there is one, otherwise initials on a green gradient. */
export function Avatar({ name, uri, size = 44, ring }: Props) {
  const [c1, c2] = tint(name);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  const inner = ring ? size - 8 : size;

  const face = uri ? (
    <Image source={{ uri }} style={{ width: inner, height: inner, borderRadius: inner / 2 }} />
  ) : (
    <LinearGradient colors={[c1, c2]} style={{ width: inner, height: inner, borderRadius: inner / 2, alignItems: "center", justifyContent: "center" }}>
      <T style={{ fontFamily: font.bold, fontSize: inner * 0.38, color: colors.light }}>{initials || "?"}</T>
    </LinearGradient>
  );

  if (!ring) return face;
  return (
    <LinearGradient
      colors={ring === "new" ? [colors.light, colors.accent] : [colors.line, colors.line]}
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View style={[styles.gap, { width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }]}>{face}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  ring: { alignItems: "center", justifyContent: "center" },
  gap: { backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
});

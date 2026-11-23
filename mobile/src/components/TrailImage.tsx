import type { ReactNode } from "react";
import { ImageBackground, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { T } from "./T";

/** Mossy green gradients shown while a trail has no photo yet. Each seed picks one, always the same. */
const PLACEHOLDERS: [string, string][] = [
  ["#3F7A62", "#0F3A30"],
  ["#5C8F76", "#143D33"],
  ["#2F6B58", "#0A2A25"],
  ["#6A9B84", "#18453A"],
];

function pick(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PLACEHOLDERS[h % PLACEHOLDERS.length];
}

interface Props {
  /** The photo, or undefined to show the placeholder. Get it from `trailPhotos(trail)[0]`. */
  source?: ImageSourcePropType;
  /** Any stable string (the trail id). Picks the placeholder colour. */
  seed: string;
  style?: StyleProp<ViewStyle>;
  /** Darken the bottom so white text on top stays readable. Default true. */
  shade?: boolean;
  /** Small tiles: icon only, no "Add photo" text. */
  compact?: boolean;
  children?: ReactNode;
}

/** A photo that falls back to a green gradient placeholder until you add the real image. */
export function TrailImage({ source, seed, style, shade = true, compact = false, children }: Props) {
  const [c1, c2] = pick(seed);
  const inner = (
    <>
      {shade && <LinearGradient colors={["rgba(5,31,32,0)", "rgba(5,31,32,0.82)"]} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />}
      {children}
    </>
  );

  if (source) {
    return (
      <ImageBackground source={source} resizeMode="cover" style={[styles.fill, style]}>
        {inner}
      </ImageBackground>
    );
  }
  return (
    <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.fill, style]}>
      <View style={[styles.placeholder, compact && { paddingBottom: 0 }]} pointerEvents="none">
        <Ionicons name="image-outline" size={compact ? 22 : 34} color="rgba(218,241,222,0.35)" />
        {!compact && (
          <T variant="small" color="rgba(218,241,222,0.4)" style={{ marginTop: 4 }}>
            Add photo
          </T>
        )}
      </View>
      {inner}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { overflow: "hidden", backgroundColor: colors.surface },
  placeholder: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", paddingBottom: 40 },
});

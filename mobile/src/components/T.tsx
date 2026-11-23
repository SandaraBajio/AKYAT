import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, font } from "../theme";

export type Variant = "display" | "h1" | "h2" | "title" | "body" | "small" | "caps" | "stat" | "statSm";

const V: Record<Variant, TextStyle> = {
  display: { fontFamily: font.black, fontSize: 40, lineHeight: 44, letterSpacing: -1.2 },
  h1: { fontFamily: font.bold, fontSize: 28, lineHeight: 33, letterSpacing: -0.6 },
  h2: { fontFamily: font.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  title: { fontFamily: font.semi, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: font.medium, fontSize: 12.5, lineHeight: 17 },
  caps: { fontFamily: font.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.3, textTransform: "uppercase" },
  stat: { fontFamily: font.bold, fontSize: 26, lineHeight: 30, letterSpacing: -0.6 },
  statSm: { fontFamily: font.bold, fontSize: 17, lineHeight: 22 },
};

/** Themed text. Use this instead of <Text> so the font and colours stay consistent. */
export function T({ variant = "body", color = colors.text, style, ...rest }: TextProps & { variant?: Variant; color?: string }) {
  return <Text {...rest} style={[V[variant], { color }, style]} />;
}

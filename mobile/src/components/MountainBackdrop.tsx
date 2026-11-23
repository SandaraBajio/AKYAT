import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Ellipse, Path } from "react-native-svg";
import { colors } from "../theme";

/** A jagged ridge line filled down to the bottom. `seed` changes the shape. */
function ridge(seed: number, baseY: number, amp: number, w = 400, h = 800): string {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += 16) {
    const peak = Math.abs(Math.sin(x / 52 + seed)) * 0.7 + Math.abs(Math.sin(x / 21 + seed * 2.3)) * 0.3;
    pts.push(`${x},${(baseY - amp * peak).toFixed(1)}`);
  }
  return `M0,${h} L${pts.join(" L")} L${w},${h} Z`;
}

/**
 * Foggy mountain scene drawn in code (no photo needed) for the welcome and login screens.
 * Fills its parent. To use a real photo later, put an <Image> behind it.
 */
export function MountainBackdrop({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <LinearGradient colors={["#6FA08A", "#3C7261", "#163832", colors.bg]} locations={[0, 0.3, 0.62, 1]} style={StyleSheet.absoluteFill} />
      <Svg width="100%" height="100%" viewBox="0 0 400 800" preserveAspectRatio="xMidYMin slice">
        <Path d={ridge(1.2, 330, 150)} fill="#8EB69B" opacity={0.35} />
        <Ellipse cx={90} cy={250} rx={130} ry={26} fill="#DAF1DE" opacity={0.16} />
        <Ellipse cx={320} cy={300} rx={150} ry={30} fill="#DAF1DE" opacity={0.14} />
        <Path d={ridge(3.4, 400, 130)} fill="#235347" opacity={0.85} />
        <Ellipse cx={200} cy={370} rx={220} ry={34} fill="#DAF1DE" opacity={0.12} />
        <Path d={ridge(5.1, 470, 105)} fill="#163832" />
        <Path d={ridge(7.7, 560, 80)} fill="#0B2B26" />
      </Svg>
    </View>
  );
}

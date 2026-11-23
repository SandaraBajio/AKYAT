import { View } from "react-native";
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from "react-native-svg";
import { cardinal } from "../lib/format";
import { colors, font } from "../theme";
import { T } from "./T";

/**
 * Compass dial (like the Hike Details reference). The dial turns so the direction you face
 * is always at the top. `heading` is degrees clockwise from north (0 to 360).
 */
export function Compass({ heading, size = 220 }: { heading: number; size?: number }) {
  const c = size / 2;
  const r = size / 2 - 6;
  const h = ((heading % 360) + 360) % 360;

  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const letters: [string, number][] = [["N", 0], ["E", 90], ["S", 180], ["W", 270]];
  const numbers = [30, 60, 120, 150, 210, 240, 300, 330];

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle cx={c} cy={c} r={r} fill={colors.surface} stroke={colors.line} strokeWidth={1.5} />
        <G transform={`rotate(${-h} ${c} ${c})`}>
          {ticks.map((deg) => {
            const major = deg % 30 === 0;
            const len = major ? 12 : 6;
            return (
              <G key={deg} transform={`rotate(${deg} ${c} ${c})`}>
                <Line x1={c} x2={c} y1={c - r + 4} y2={c - r + 4 + len} stroke={major ? colors.accent : colors.line} strokeWidth={major ? 2 : 1} />
              </G>
            );
          })}
          {numbers.map((deg) => (
            <G key={deg} transform={`rotate(${deg} ${c} ${c})`}>
              <SvgText x={c} y={c - r + 34} fill={colors.muted} fontSize={10} fontFamily={font.medium} textAnchor="middle">
                {deg}
              </SvgText>
            </G>
          ))}
          {letters.map(([l, deg]) => (
            <G key={l} transform={`rotate(${deg} ${c} ${c})`}>
              <SvgText x={c} y={c - r + 38} fill={l === "N" ? colors.marker : colors.light} fontSize={17} fontFamily={font.bold} textAnchor="middle">
                {l}
              </SvgText>
            </G>
          ))}
        </G>
        {/* fixed pointer at the top */}
        <Polygon points={`${c - 7},${6} ${c + 7},${6} ${c},${20}`} fill={colors.light} />
        <Circle cx={c} cy={c} r={r * 0.46} fill={colors.surface2} stroke={colors.line} strokeWidth={1} />
      </Svg>
      <View style={{ position: "absolute", alignItems: "center" }} accessibilityLabel={`Heading ${Math.round(h)} degrees ${cardinal(h)}`}>
        <T variant="stat" style={{ fontSize: size * 0.17 }}>
          {Math.round(h)}°
        </T>
        <T variant="small" color={colors.accent}>
          {cardinal(h)}
        </T>
      </View>
    </View>
  );
}

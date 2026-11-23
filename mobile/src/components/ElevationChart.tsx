import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";
import { colors } from "../theme";
import { T } from "./T";

const W = 320;
const H = 130;

interface Props {
  /** Metres above sea level, evenly spaced from start to end. */
  profile?: number[];
  /** Used for the km labels under the chart. */
  distanceKm?: number;
}

/** Elevation profile (dark version from the map reference). Drop it inside any surface card. */
export function ElevationChart({ profile, distanceKm }: Props) {
  if (!profile || profile.length < 2) {
    return (
      <T variant="small" color={colors.muted} style={{ paddingVertical: 20 }}>
        Elevation profile coming soon.
      </T>
    );
  }

  const min = Math.min(...profile);
  const max = Math.max(...profile);
  const span = max - min || 1;
  const x = (i: number) => (i / (profile.length - 1)) * W;
  const y = (v: number) => 12 + (1 - (v - min) / span) * (H - 24);

  const line = profile.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const peakIdx = profile.indexOf(max);
  const markers = [0.2, 0.42, 0.64, 0.84].map((t) => Math.round(t * (profile.length - 1)));
  const labels = distanceKm ? [0, 0.25, 0.5, 0.75, 1].map((t) => `${(t * distanceKm).toFixed(1)} km`) : [];

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.light} stopOpacity={0.22} />
            <Stop offset="1" stopColor={colors.light} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <Line key={t} x1={0} x2={W} y1={H * t} y2={H * t} stroke={colors.line} strokeWidth={1} strokeDasharray="4 4" />
        ))}
        <Path d={area} fill="url(#elevFill)" />
        <Path d={line} fill="none" stroke={colors.light} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <Line x1={x(peakIdx)} x2={x(peakIdx)} y1={y(max)} y2={H} stroke={colors.light} strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
        {markers.map((i) => (
          <Circle key={i} cx={x(i)} cy={y(profile[i])} r={4} fill={colors.marker} />
        ))}
        <Circle cx={x(peakIdx)} cy={y(max)} r={6} fill={colors.marker} stroke={colors.light} strokeWidth={2} />
      </Svg>
      {labels.length > 0 && (
        <View style={styles.labels}>
          {labels.map((l) => (
            <T key={l} variant="small" color={colors.muted} style={{ fontSize: 11 }}>
              {l}
            </T>
          ))}
        </View>
      )}
      <View style={styles.legend}>
        <T variant="small" color={colors.light}>
          Low {min} m
        </T>
        <T variant="small" color={colors.light}>
          High {max} m
        </T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  legend: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
});

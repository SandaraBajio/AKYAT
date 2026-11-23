import { StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Polyline } from "react-native-svg";
import type { LatLng } from "../types";
import { colors } from "../theme";
import { RouteInfoCard } from "./RouteInfoCard";
import type { RouteMapProps } from "./RouteMap.types";
import { T } from "./T";

const W = 360;
const H = 320;
const PAD = 44;

/** Scales GPS points into the drawing box. Latitude is flipped to y so north is up. */
function project(points: LatLng[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1e-6;
  const spanLng = maxLng - minLng || 1e-6;
  const scale = Math.min((W - PAD * 2) / spanLng, (H - PAD * 2) / spanLat);
  const offX = (W - spanLng * scale) / 2;
  const offY = (H - spanLat * scale) / 2;
  return (p: LatLng) => ({ x: offX + (p.lng - minLng) * scale, y: offY + (maxLat - p.lat) * scale });
}

/**
 * Fallback map (web, and any device where the native map isn't available): a dark contour-style
 * preview with the route drawn on top. On iPhone and Android the real satellite map in
 * RouteMap.native.tsx is used instead. Same props, so screens don't care which one they get.
 */
export function RouteMap({ route, current, summitM, distanceKm, height = 320, rounded = true, style }: RouteMapProps) {
  const all = [...(route ?? []), ...(current ? [current] : [])];
  const to = all.length > 0 ? project(all) : null;
  const pts = route && route.length > 1 && to ? route.map(to) : null;
  const polyline = pts?.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const here = current && to ? to(current) : null;
  const mid = here ?? (pts ? pts[Math.floor(pts.length / 2)] : { x: W / 2, y: H / 2 });

  return (
    <View style={[styles.wrap, { height }, rounded && { borderRadius: 28 }, style]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        {[22, 44, 70, 100, 134, 172, 214, 260].map((r, i) => (
          <Ellipse
            key={r}
            cx={mid.x}
            cy={mid.y}
            rx={r * 1.25}
            ry={r * 0.9}
            fill="none"
            stroke={colors.line}
            strokeWidth={1.2}
            opacity={0.9 - i * 0.08}
            transform={`rotate(${-18 + i * 3} ${mid.x} ${mid.y})`}
          />
        ))}
        {polyline && (
          <>
            <Polyline points={polyline} fill="none" stroke={colors.route} strokeWidth={10} opacity={0.16} strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points={polyline} fill="none" stroke={colors.route} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={pts![0].x} cy={pts![0].y} r={6} fill={colors.bg} stroke={colors.light} strokeWidth={2.5} />
          </>
        )}
        {here ? (
          <>
            <Circle cx={here.x} cy={here.y} r={18} fill={colors.route} opacity={0.2} />
            <Circle cx={here.x} cy={here.y} r={8} fill={colors.route} stroke={colors.white} strokeWidth={2.5} />
          </>
        ) : (
          <>
            <Circle cx={mid.x} cy={mid.y} r={16} fill={colors.marker} opacity={0.22} />
            <Circle cx={mid.x} cy={mid.y} r={8} fill={colors.marker} stroke={colors.white} strokeWidth={2.5} />
          </>
        )}
      </Svg>

      {!pts && !here && (
        <T variant="small" color="rgba(218,241,222,0.5)" style={styles.empty}>
          No route yet
        </T>
      )}

      <RouteInfoCard summitM={summitM} distanceKm={distanceKm} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: "#06231F", overflow: "hidden" },
  empty: { position: "absolute", alignSelf: "center", top: "46%" },
});

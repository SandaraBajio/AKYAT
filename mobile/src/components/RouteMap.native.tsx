import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import { colors } from "../theme";
import { RouteInfoCard } from "./RouteInfoCard";
import type { RouteMapProps } from "./RouteMap.types";

/**
 * Real satellite map for iPhone and Android (react-native-maps: Apple Maps on iOS, works in Expo Go).
 * Same props as the web fallback in RouteMap.tsx.
 * UNTESTED ON A DEVICE: written against the library docs. If it misbehaves, delete this file and the
 * app falls back to RouteMap.tsx automatically.
 */
export function RouteMap({ route, current, summitM, distanceKm, height = 320, rounded = true, follow, style }: RouteMapProps) {
  const ref = useRef<MapView>(null);
  const hasRoute = !!route && route.length > 1;

  // Fit the whole route into view when it first appears (preview maps).
  useEffect(() => {
    if (!hasRoute || follow) return;
    const t = setTimeout(() => {
      ref.current?.fitToCoordinates(
        route!.map((p) => ({ latitude: p.lat, longitude: p.lng })),
        { edgePadding: { top: 60, right: 40, bottom: 60, left: 40 }, animated: false }
      );
    }, 300);
    return () => clearTimeout(t);
  }, [hasRoute, route, follow]);

  // Live hike: keep the camera on the hiker.
  useEffect(() => {
    if (follow && current) {
      ref.current?.animateCamera({ center: { latitude: current.lat, longitude: current.lng }, zoom: 16 }, { duration: 600 });
    }
  }, [follow, current]);

  return (
    <View style={[styles.wrap, { height }, rounded && { borderRadius: 28 }, style]}>
      <MapView
        ref={ref}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_DEFAULT}
        mapType="satellite"
        initialRegion={{
          latitude: route?.[0]?.lat ?? current?.lat ?? 13.9,
          longitude: route?.[0]?.lng ?? current?.lng ?? 121.0,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        {hasRoute && (
          <Polyline coordinates={route!.map((p) => ({ latitude: p.lat, longitude: p.lng }))} strokeColor={colors.route} strokeWidth={4} />
        )}
        {current && (
          <Marker coordinate={{ latitude: current.lat, longitude: current.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={styles.dotOuter}>
              <View style={styles.dotInner} />
            </View>
          </Marker>
        )}
      </MapView>
      <RouteInfoCard summitM={summitM} distanceKm={distanceKm} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden", backgroundColor: "#06231F" },
  dotOuter: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(126,240,169,0.3)", alignItems: "center", justifyContent: "center" },
  dotInner: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.route, borderWidth: 2.5, borderColor: colors.white },
});

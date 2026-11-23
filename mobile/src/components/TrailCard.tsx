import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { trailPhotos } from "../data/trailImages";
import { duration } from "../lib/format";
import { useSaved } from "../state/saved";
import { colors, difficultyStyle } from "../theme";
import type { Trail } from "../types";
import { T } from "./T";
import { TrailImage } from "./TrailImage";
import { RoundButton } from "./ui";

/**
 * The big photo card from the Home reference: name + height on top, three stats along the bottom.
 * Pass `width` for carousels, or leave it out for a full-width list card.
 */
export function TrailCard({ trail, width, height = 330 }: { trail: Trail; width?: number; height?: number }) {
  const router = useRouter();
  const { isSaved, toggle } = useSaved();
  const summit = trail.elevationProfile?.length ? Math.max(...trail.elevationProfile) : null;
  const diff = trail.difficulty ? difficultyStyle[trail.difficulty] : null;

  const stats: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }[] = [
    { icon: "time-outline", value: trail.durationHours != null ? `${trail.durationHours}h` : "--", label: "Duration" },
    { icon: "trail-sign-outline", value: trail.distanceKm != null ? `${trail.distanceKm}km` : "--", label: "Distance" },
    { icon: "speedometer-outline", value: diff?.label ?? "--", label: "Level" },
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${trail.name}`}
      onPress={() => router.push({ pathname: "/trail/[id]", params: { id: trail.id } })}
      style={[styles.wrap, { height }, width != null && { width }]}
    >
      <TrailImage source={trailPhotos(trail)[0]} seed={trail.id} style={styles.image}>
        <View style={styles.top}>
          <View style={{ flex: 1 }}>
            <T variant="h1" color={colors.light} numberOfLines={2}>
              {trail.name}
            </T>
            <T variant="body" color="rgba(218,241,222,0.8)">
              {summit != null ? `${summit.toLocaleString()} meters` : (trail.location ?? "Batangas")}
            </T>
          </View>
          <RoundButton icon={isSaved(trail.id) ? "bookmark" : "bookmark-outline"} label="Save trail" onPress={() => toggle(trail.id)} active={isSaved(trail.id)} />
        </View>
        <View style={styles.bottom}>
          {stats.map((s) => (
            <View key={s.label} style={styles.stat}>
              <Ionicons name={s.icon} size={18} color={colors.accent} />
              <View>
                <T variant="small" color={colors.light} style={{ fontSize: 14 }}>
                  {s.value}
                </T>
                <T variant="small" color={colors.muted} style={{ fontSize: 11 }}>
                  {s.label}
                </T>
              </View>
            </View>
          ))}
        </View>
      </TrailImage>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 30, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surface2 },
  image: { flex: 1, justifyContent: "space-between", padding: 18 },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  bottom: { flexDirection: "row", justifyContent: "space-between" },
  stat: { flexDirection: "row", alignItems: "center", gap: 7 },
});

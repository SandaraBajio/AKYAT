import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../src/components/Button";
import { RouteMap } from "../../src/components/RouteMap";
import { T } from "../../src/components/T";
import { TAB_BAR_SPACE, colors, shared } from "../../src/theme";
import { tap } from "../../src/lib/haptics";
import { startHike, useHike } from "../../src/state/hike";
import { trailsService } from "../../src/services";
import type { Trail } from "../../src/types";

export default function Record() {
  const { trailId } = useLocalSearchParams<{ trailId?: string }>();
  const router = useRouter();
  const hike = useHike();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selected, setSelected] = useState<string | null>(trailId ?? null);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    trailsService.listTrails().then(setTrails).catch(() => {});
  }, []);
  useEffect(() => {
    if (trailId) setSelected(trailId);
  }, [trailId]);

  const trail = trails.find((t) => t.id === selected);
  const inProgress = hike.status === "running" || hike.status === "paused";

  async function start() {
    setError(null);
    setBusy(true);
    const res = await startHike({
      demo,
      trail: trail ? { id: trail.id, name: trail.name, route: trail.route, elevationProfile: trail.elevationProfile } : undefined,
    });
    setBusy(false);
    if (res.ok) router.push("/hike/active");
    else setError(res.message);
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: TAB_BAR_SPACE + 20 }}>
      <T variant="h1">Record a hike</T>
      <T variant="body" color={colors.muted} style={{ marginTop: 4 }}>
        Track distance, pace, climb and your route, Strava style.
      </T>

      <View style={{ marginTop: 18 }}>
        <RouteMap route={trail?.route} height={210} summitM={trail?.elevationProfile ? Math.max(...trail.elevationProfile) : undefined} distanceKm={trail?.distanceKm} />
      </View>

      <T variant="caps" color={colors.muted} style={{ marginTop: 22, marginBottom: 10 }}>
        Trail (optional)
      </T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
        <Pressable onPress={() => { tap(); setSelected(null); }} style={[styles.opt, !selected && styles.optOn]}>
          <Ionicons name="compass-outline" size={16} color={!selected ? colors.onLight : colors.light} />
          <T variant="small" color={!selected ? colors.onLight : colors.light}>Free hike</T>
        </Pressable>
        {trails.map((t) => {
          const on = t.id === selected;
          return (
            <Pressable key={t.id} onPress={() => { tap(); setSelected(t.id); }} style={[styles.opt, on && styles.optOn]}>
              <T variant="small" color={on ? colors.onLight : colors.light}>{t.name}</T>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[shared.card, shared.between, { marginTop: 20 }]}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <T variant="title">Demo mode</T>
          <T variant="small" color={colors.muted}>
            Simulates a fast-forwarded walk. Good for trying the app at your desk.
          </T>
        </View>
        <Switch value={demo} onValueChange={setDemo} trackColor={{ true: colors.accent, false: colors.line }} thumbColor={colors.light} />
      </View>

      {error && (
        <T variant="small" color="#FFB4A8" style={{ marginTop: 12 }}>
          {error}
        </T>
      )}

      {inProgress ? (
        <Button title="Resume current hike" icon="play" style={{ marginTop: 22 }} onPress={() => router.push("/hike/active")} />
      ) : (
        <Button title="Start" icon="play" loading={busy} style={{ marginTop: 22 }} onPress={start} />
      )}
      <T variant="small" color={colors.muted} style={{ textAlign: "center", marginTop: 12 }}>
        Keep the app open while you hike. Recording with the screen locked needs a development build.
      </T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  opt: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  optOn: { backgroundColor: colors.light, borderColor: colors.light },
});

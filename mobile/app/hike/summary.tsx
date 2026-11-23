import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../src/components/Button";
import { ElevationChart } from "../../src/components/ElevationChart";
import { RouteMap } from "../../src/components/RouteMap";
import { T } from "../../src/components/T";
import { useAuth } from "../../src/context/AuthContext";
import { clock, duration, pace } from "../../src/lib/format";
import { success } from "../../src/lib/haptics";
import { downsample, elevationProfile } from "../../src/lib/tracking";
import { activitiesService, isMockMode, ServiceError } from "../../src/services";
import { resetHike, useHike } from "../../src/state/hike";
import { colors, shared } from "../../src/theme";

export default function HikeSummary() {
  const hike = useHike();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hike.status !== "finished") {
    return (
      <View style={[shared.screen, { padding: 24, paddingTop: insets.top + 40 }]}>
        <T color={colors.muted}>No finished hike to show.</T>
        <Button title="Back to Record" style={{ marginTop: 16 }} onPress={() => router.replace("/record")} />
      </View>
    );
  }

  const sec = hike.accumulatedMs / 1000;
  const km = Math.round((hike.track.distanceM / 1000) * 100) / 100;
  const gain = Math.round(hike.track.gainM);
  const route = downsample(hike.track.points, 300).map((p) => ({ lat: p.lat, lng: p.lng }));
  const profile = elevationProfile(hike.track.points, 40);
  // Demo hikes are fake. In the real (Firebase) app they must not count toward real stats.
  const canSave = !(hike.demo && !isMockMode);

  async function save() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      await activitiesService.saveActivity({
        hikerId: user.uid,
        trailId: hike.trailId,
        trailName: hike.trailName,
        startedAt: hike.startedAt ?? Date.now(),
        durationSec: Math.round(sec),
        distanceKm: km,
        elevationGainM: gain,
        route,
      });
      success();
      setSaved(true);
    } catch (e) {
      setError(e instanceof ServiceError ? e.message : "Could not save this hike.");
    } finally {
      setBusy(false);
    }
  }

  function done() {
    resetHike();
    router.replace("/profile");
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
      <RouteMap route={route} height={300} rounded={false} />
      <View style={{ padding: 20 }}>
        <T variant="h1">{hike.trailName ?? "Free hike"}</T>
        <T variant="small" color={colors.muted}>
          {new Date(hike.startedAt ?? Date.now()).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
          {hike.demo ? " · demo" : ""}
        </T>

        <View style={styles.tiles}>
          {[
            ["Distance", `${km.toFixed(2)} km`],
            ["Time", sec < 3600 ? clock(sec) : duration(sec)],
            ["Pace", pace(sec, km)],
            ["Climb", `${gain} m`],
          ].map(([l, v]) => (
            <View key={l} style={styles.tile}>
              <T variant="stat">{v}</T>
              <T variant="small" color={colors.muted}>{l}</T>
            </View>
          ))}
        </View>

        {profile.length > 1 && (
          <View style={[shared.card, { marginTop: 14 }]}>
            <T variant="h2" style={{ marginBottom: 12 }}>Elevation</T>
            <ElevationChart profile={profile} distanceKm={km} />
          </View>
        )}

        {!canSave && (
          <T variant="small" color={colors.muted} style={{ marginTop: 14 }}>
            Demo hikes aren't saved to your real stats.
          </T>
        )}
        {error && (
          <T variant="small" color="#FFB4A8" style={{ marginTop: 14 }}>
            {error}
          </T>
        )}

        {saved ? (
          <T variant="title" color={colors.accent} style={{ marginTop: 18 }}>
            Saved to your profile ✓
          </T>
        ) : (
          canSave && <Button title="Save hike" icon="save-outline" loading={busy} style={{ marginTop: 18 }} onPress={save} />
        )}

        <Button
          title="Share to community"
          icon="images-outline"
          variant="secondary"
          style={{ marginTop: 10 }}
          onPress={() =>
            router.push({
              pathname: "/post/new",
              params: { trailId: hike.trailId ?? "", trailName: hike.trailName ?? "", distanceKm: String(km), durationSec: String(Math.round(sec)), elevationGainM: String(gain) },
            })
          }
        />
        {hike.trailId && (
          <Button title="Rate this trail" icon="star-outline" variant="secondary" style={{ marginTop: 10 }} onPress={() => router.push({ pathname: "/rate", params: { trailId: hike.trailId! } })} />
        )}
        <Button title={saved || !canSave ? "Done" : "Discard"} variant="ghost" style={{ marginTop: 6 }} onPress={done} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  tile: { width: "48%", backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surface2, padding: 14 },
});

import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../../src/components/Button";
import { Compass } from "../../src/components/Compass";
import { RouteMap } from "../../src/components/RouteMap";
import { T } from "../../src/components/T";
import { useAuth } from "../../src/context/AuthContext";
import { cardinal, clock, pace } from "../../src/lib/format";
import { warn } from "../../src/lib/haptics";
import { finishHike, pauseHike, resumeHike, useElapsed, useHike } from "../../src/state/hike";
import { safetyService } from "../../src/services";
import { colors, shared } from "../../src/theme";

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <T variant="stat">{value}</T>
      <T variant="small" color={colors.muted}>{label}</T>
    </View>
  );
}

export default function ActiveHike() {
  const hike = useHike();
  const sec = useElapsed();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [notice, setNotice] = useState<string | null>(null);

  // Nothing to show if there is no hike (e.g. opened by URL).
  useEffect(() => {
    if (hike.status === "idle") router.replace("/record");
    if (hike.status === "finished") router.replace("/hike/summary");
  }, [hike.status, router]);

  const km = hike.track.distanceM / 1000;
  const route = hike.track.points.length > 1 ? hike.track.points.map((p) => ({ lat: p.lat, lng: p.lng })) : hike.plannedRoute ?? undefined;

  function confirmFinish() {
    const doIt = () => finishHike();
    if (Platform.OS === "web") {
      doIt();
      return;
    }
    Alert.alert("Finish this hike?", "You can review and save it next.", [
      { text: "Keep going", style: "cancel" },
      { text: "Finish", style: "destructive", onPress: doIt },
    ]);
  }

  async function emergency() {
    warn();
    if (!user) return;
    const res = await safetyService.sendEmergencyAlert(user, hike.current);
    setNotice(
      res.sent
        ? "Alert sent to your guide and responders."
        : "Emergency alerts are not switched on yet, so nothing was sent. If you are in danger, call 911 or your guide directly."
    );
  }

  return (
    <View style={shared.screen}>
      <RouteMap route={route} current={hike.current} follow height={300} rounded={false} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}>
        <View style={{ alignItems: "center" }}>
          <T variant="caps" color={colors.muted}>
            {hike.status === "paused" ? "Paused" : hike.demo ? "Demo hike" : hike.gps === "weak" ? "Weak GPS signal" : hike.gps === "starting" ? "Finding GPS..." : "Recording"}
            {hike.trailName ? ` · ${hike.trailName}` : ""}
          </T>
          <T variant="display" style={{ fontSize: 56, lineHeight: 62 }}>
            {clock(sec)}
          </T>
        </View>

        <View style={styles.tiles}>
          <Tile label="Distance (km)" value={km.toFixed(2)} />
          <Tile label="Pace" value={pace(sec, km)} />
          <Tile label="Climb (m)" value={String(Math.round(hike.track.gainM))} />
        </View>

        <View style={[shared.card, { alignItems: "center", marginTop: 14 }]}>
          <Compass heading={hike.heading} size={190} />
          <T variant="title" style={{ marginTop: 8 }}>
            {Math.round(hike.heading)}° {cardinal(hike.heading)}
          </T>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          {hike.status === "paused" ? (
            <Button title="Resume" icon="play" style={{ flex: 1 }} onPress={resumeHike} />
          ) : (
            <Button title="Pause" icon="pause" variant="secondary" style={{ flex: 1 }} onPress={pauseHike} />
          )}
          <Button title="Finish" icon="stop" style={{ flex: 1 }} onPress={confirmFinish} />
        </View>

        <Button title="Emergency alert" icon="warning-outline" variant="danger" style={{ marginTop: 12 }} onPress={emergency} />
        {notice && (
          <T variant="small" color="#FFB4A8" style={{ marginTop: 10 }}>
            {notice}
          </T>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: "row", gap: 10, marginTop: 14 },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surface2, paddingVertical: 14, alignItems: "center" },
});

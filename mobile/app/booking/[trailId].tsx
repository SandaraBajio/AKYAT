import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "../../src/components/Button";
import { T } from "../../src/components/T";
import { tap } from "../../src/lib/haptics";
import { trailsService } from "../../src/services";
import { colors, peso, shared, toDateKey } from "../../src/theme";
import type { Trail } from "../../src/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CreateBooking() {
  const { trailId } = useLocalSearchParams<{ trailId: string }>();
  const router = useRouter();
  const [trail, setTrail] = useState<Trail | null | undefined>(undefined);
  const [partySize, setPartySize] = useState(2);

  // The next 21 days, starting tomorrow.
  const days = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => {
        const d = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000);
        return { key: toDateKey(d), weekday: WEEKDAYS[d.getDay()], day: d.getDate(), month: d.toLocaleDateString("en-PH", { month: "short" }) };
      }),
    []
  );
  const [dateKey, setDateKey] = useState(days[0].key);

  useEffect(() => {
    trailsService.getTrail(trailId).then(setTrail).catch(() => setTrail(null));
  }, [trailId]);

  if (trail === undefined) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />;
  if (trail === null) return <T color="#FFB4A8" style={{ padding: 20 }}>Trail not found.</T>;

  const total = trail.pricePerPerson * partySize;

  return (
    <View style={shared.screen}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <T variant="h1">{trail.name}</T>
        <T variant="small" color={colors.muted}>
          {trail.location ?? "Batangas"}
        </T>

        <T variant="caps" color={colors.muted} style={styles.label}>
          Date
        </T>
        {/* TODO (UI): month calendar view; this chip row is the quick version. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {days.map((d) => {
            const on = d.key === dateKey;
            return (
              <Pressable key={d.key} accessibilityRole="button" accessibilityLabel={`${d.weekday} ${d.day} ${d.month}`} onPress={() => { tap(); setDateKey(d.key); }} style={[styles.day, on && styles.dayOn]}>
                <T variant="small" color={on ? colors.onLight : colors.muted}>
                  {d.weekday}
                </T>
                <T variant="stat" color={on ? colors.onLight : colors.light} style={{ marginVertical: 2 }}>
                  {d.day}
                </T>
                <T variant="small" color={on ? colors.onLight : colors.muted}>
                  {d.month}
                </T>
              </Pressable>
            );
          })}
        </ScrollView>

        <T variant="caps" color={colors.muted} style={styles.label}>
          Person
        </T>
        <View style={[shared.card, styles.stepper]}>
          <Pressable style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="Fewer hikers" onPress={() => { tap(); setPartySize((n) => Math.max(1, n - 1)); }}>
            <T variant="h2" color={colors.onLight}>−</T>
          </Pressable>
          <View style={{ alignItems: "center" }}>
            <T variant="display" style={{ fontSize: 34, lineHeight: 38 }}>
              {partySize}
            </T>
            <T variant="small" color={colors.muted}>
              {partySize === 1 ? "hiker" : "hikers"} (max {trail.maxGroupSize})
            </T>
          </View>
          <Pressable style={styles.stepBtn} accessibilityRole="button" accessibilityLabel="More hikers" onPress={() => { tap(); setPartySize((n) => Math.min(trail.maxGroupSize, n + 1)); }}>
            <T variant="h2" color={colors.onLight}>+</T>
          </Pressable>
        </View>

        <View style={[shared.between, { marginTop: 26 }]}>
          <T color={colors.muted}>Total</T>
          <T variant="h1">{peso(total)}</T>
        </View>
        <T variant="small" color={colors.muted} style={{ marginTop: 4 }}>
          {peso(trail.pricePerPerson)} × {partySize} {partySize === 1 ? "person" : "people"}
        </T>

        <Button title="Next" iconRight="arrow-forward" style={{ marginTop: 24 }} onPress={() => router.push({ pathname: "/payment", params: { trailId: trail.id, dateKey, partySize: String(partySize) } })} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 24, marginBottom: 10 },
  day: { width: 64, paddingVertical: 12, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surface2, alignItems: "center" },
  dayOn: { backgroundColor: colors.light, borderColor: colors.light },
  stepper: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.light, alignItems: "center", justifyContent: "center" },
});

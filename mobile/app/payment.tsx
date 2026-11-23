import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../src/components/Button";
import { T } from "../src/components/T";
import { tap } from "../src/lib/haptics";
import { bookingsService, ServiceError, trailsService } from "../src/services";
import { colors, peso, shared } from "../src/theme";
import type { Trail } from "../src/types";

const METHODS: { key: string; label: string; hint: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "gcash", label: "GCash", hint: "Pay with your GCash wallet", icon: "phone-portrait-outline" },
  { key: "maya", label: "Maya", hint: "Pay with your Maya wallet", icon: "wallet-outline" },
  { key: "card", label: "Credit / debit card", hint: "Visa or Mastercard", icon: "card-outline" },
];

export default function Payment() {
  const { trailId, dateKey, partySize } = useLocalSearchParams<{ trailId: string; dateKey: string; partySize: string }>();
  const router = useRouter();
  const [trail, setTrail] = useState<Trail | null | undefined>(undefined);
  const [method, setMethod] = useState("gcash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const party = Number(partySize) || 1;

  useEffect(() => {
    trailsService.getTrail(trailId).then(setTrail).catch(() => setTrail(null));
  }, [trailId]);

  if (trail === undefined) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />;
  if (trail === null) return <T color="#FFB4A8" style={{ padding: 20 }}>Trail not found.</T>;

  const total = trail.pricePerPerson * party;

  async function pay() {
    if (!trail) return;
    setError(null);
    setBusy(true);
    try {
      // The backend creates the booking and the PayMongo checkout. Money rules live there, not here.
      const { bookingId, checkoutUrl } = await bookingsService.createBookingCheckout({ trailId: trail.id, dateKey, partySize: party });
      router.replace({ pathname: "/booking-success", params: { bookingId } });
      if (!checkoutUrl.startsWith("mock://")) await WebBrowser.openBrowserAsync(checkoutUrl);
    } catch (e) {
      setError(e instanceof ServiceError ? e.message : "Could not start the payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={shared.screen}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={shared.card}>
          <T variant="title">{trail.name}</T>
          <T variant="small" color={colors.muted}>
            {dateKey} · {party} {party === 1 ? "hiker" : "hikers"}
          </T>
          <View style={[shared.between, { marginTop: 14 }]}>
            <T color={colors.muted}>Total</T>
            <T variant="h1">{peso(total)}</T>
          </View>
        </View>

        <T variant="caps" color={colors.muted} style={{ marginTop: 24, marginBottom: 10 }}>
          Pay with
        </T>
        {METHODS.map((m) => {
          const on = m.key === method;
          return (
            <Pressable key={m.key} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { tap(); setMethod(m.key); }} style={[styles.method, on && styles.methodOn]}>
              <View style={styles.icon}>
                <Ionicons name={m.icon} size={22} color={colors.light} />
              </View>
              <View style={{ flex: 1 }}>
                <T variant="title">{m.label}</T>
                <T variant="small" color={colors.muted}>
                  {m.hint}
                </T>
              </View>
              <Ionicons name={on ? "radio-button-on" : "radio-button-off"} size={22} color={on ? colors.light : colors.line} />
            </Pressable>
          );
        })}
        <T variant="small" color={colors.muted} style={{ marginTop: 6 }}>
          You'll confirm the payment on PayMongo's secure page next.
        </T>

        {error && (
          <T variant="small" color="#FFB4A8" style={{ marginTop: 12 }}>
            {error}
          </T>
        )}

        <Button title={`Pay ${peso(total)}`} loading={busy} style={{ marginTop: 22 }} onPress={pay} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  method: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: colors.surface2 },
  methodOn: { borderColor: colors.accent },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" },
});

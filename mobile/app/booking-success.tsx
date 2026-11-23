import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../src/components/Button";
import { T } from "../src/components/T";
import { useAuth } from "../src/context/AuthContext";
import { bookingsService } from "../src/services";
import { colors, shared } from "../src/theme";
import type { Booking } from "../src/types";

export default function BookingSuccess() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;
    // Live: flips from "waiting" to "confirmed" when the backend webhook finishes.
    return bookingsService.subscribeMyBookings(user.uid, (list) => setBooking(list.find((b) => b.id === bookingId) ?? null));
  }, [user, bookingId]);

  const confirmed = booking?.status === "confirmed";
  const cancelled = booking?.status === "cancelled";

  return (
    <View style={[shared.screen, { paddingTop: insets.top + 70, paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={{ flex: 1, alignItems: "center" }}>
        <View style={[styles.circle, confirmed && { backgroundColor: colors.light }, cancelled && { backgroundColor: colors.danger }]}>
          <Ionicons name={confirmed ? "checkmark" : cancelled ? "close" : "time-outline"} size={58} color={confirmed ? colors.onLight : colors.white} />
        </View>
        <T variant="h1" style={{ marginTop: 28, textAlign: "center" }}>
          {confirmed ? "Booking confirmed!" : cancelled ? "Booking cancelled" : "Almost there"}
        </T>
        <T variant="body" color={colors.muted} style={{ textAlign: "center", marginTop: 10 }}>
          {confirmed
            ? `Your guide is assigned for ${booking?.dateKey}. We'll remind you the evening before.`
            : cancelled
              ? "The payment wasn't completed, so this booking was cancelled."
              : "Finish paying on the PayMongo page. This screen updates by itself once your payment arrives."}
        </T>
        {!confirmed && !cancelled && (
          <T variant="small" color={colors.accent} style={{ marginTop: 16 }}>
            Waiting for payment...
          </T>
        )}
      </View>

      <Button title="View my bookings" onPress={() => router.replace("/bookings")} />
      <Button title="Explore more trails" variant="ghost" onPress={() => router.replace("/")} style={{ marginTop: 6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { width: 124, height: 124, borderRadius: 62, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
});

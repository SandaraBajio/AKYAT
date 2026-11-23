import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../src/components/Button";
import { T } from "../src/components/T";
import { useAuth } from "../src/context/AuthContext";
import { bookingsService, guidesService, trailsService } from "../src/services";
import { colors, peso, shared, statusLabel, toDateKey } from "../src/theme";
import type { Booking } from "../src/types";

export default function MyBookings() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trailNames, setTrailNames] = useState<Record<string, string>>({});
  const [guideNames, setGuideNames] = useState<Record<string, string>>({});

  useEffect(() => {
    trailsService.listTrails().then((ts) => setTrailNames(Object.fromEntries(ts.map((t) => [t.id, t.name]))));
    guidesService.listGuides().then((gs) => setGuideNames(Object.fromEntries(gs.map((g) => [g.id, g.name])))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    // Live updates: the status changes on its own when the backend confirms the payment.
    return bookingsService.subscribeMyBookings(user.uid, setBookings);
  }, [user]);

  const today = toDateKey(new Date());

  return (
    <FlatList
      style={shared.screen}
      data={bookings}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: 20, gap: 12 }}
      ListEmptyComponent={
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Ionicons name="calendar-outline" size={44} color={colors.muted} />
          <T variant="title" style={{ marginTop: 10 }}>
            No bookings yet
          </T>
          <T variant="small" color={colors.muted}>
            Pick a trail on Explore to book your first hike.
          </T>
        </View>
      }
      renderItem={({ item }) => {
        const s = statusLabel[item.status];
        const canRate = item.status === "confirmed" && item.dateKey <= today;
        return (
          <View style={shared.card}>
            <View style={shared.between}>
              <T variant="title" style={{ flex: 1 }}>
                {trailNames[item.trailId] ?? item.trailId}
              </T>
              <T variant="caps" color={s.color}>
                {s.text}
              </T>
            </View>
            <T variant="small" color={colors.muted} style={{ marginTop: 2 }}>
              {item.dateKey} · {item.partySize} {item.partySize === 1 ? "hiker" : "hikers"} · {peso(item.amount)}
            </T>
            {item.guideId && (
              <View style={[shared.row, { gap: 6, marginTop: 10 }]}>
                <Ionicons name="person-circle-outline" size={18} color={colors.accent} />
                <T variant="small" color={colors.accent} onPress={() => router.push({ pathname: "/guide/[id]", params: { id: item.guideId! } })}>
                  Guide: {guideNames[item.guideId] ?? "assigned"}
                </T>
              </View>
            )}
            {canRate && (
              <Button
                title="Rate this hike"
                icon="star-outline"
                variant="secondary"
                style={{ marginTop: 12, minHeight: 44, paddingVertical: 10 }}
                onPress={() => router.push({ pathname: "/rate", params: { trailId: item.trailId, guideId: item.guideId ?? "", bookingId: item.id } })}
              />
            )}
          </View>
        );
      }}
    />
  );
}

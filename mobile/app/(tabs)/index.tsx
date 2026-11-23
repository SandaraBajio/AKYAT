import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../src/components/Avatar";
import { RingProgress } from "../../src/components/RingProgress";
import { Stars } from "../../src/components/Stars";
import { T } from "../../src/components/T";
import { TrailCard } from "../../src/components/TrailCard";
import { Chip, RoundButton, SectionHeader } from "../../src/components/ui";
import { Button } from "../../src/components/Button";
import { useAuth } from "../../src/context/AuthContext";
import { useLoad } from "../../src/hooks/useLoad";
import { firstName } from "../../src/lib/format";
import { WEEKLY_GOAL_KM, computeStats } from "../../src/lib/stats";
import { activitiesService, bookingsService, guidesService, trailsService } from "../../src/services";
import { TAB_BAR_SPACE, colors, toDateKey } from "../../src/theme";
import type { Booking, Difficulty } from "../../src/types";

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [level, setLevel] = useState<Difficulty | "all">("all");
  const [bookings, setBookings] = useState<Booking[]>([]);

  const trails = useLoad(() => trailsService.listTrails(), []);
  const guides = useLoad(() => guidesService.listGuides(), []);
  const acts = useLoad(() => activitiesService.listMyActivities(user?.uid ?? ""), [user?.uid]);

  useEffect(() => {
    if (!user) return;
    return bookingsService.subscribeMyBookings(user.uid, setBookings);
  }, [user]);

  const stats = useMemo(() => computeStats(acts.data ?? []), [acts.data]);
  const shown = (trails.data ?? []).filter((t) => level === "all" || t.difficulty === level);
  const today = toDateKey(new Date());
  const next = bookings.filter((b) => b.status === "confirmed" && b.dateKey >= today).sort((a, b) => a.dateKey.localeCompare(b.dateKey))[0];
  const nextTrail = next ? trails.data?.find((t) => t.id === next.trailId) : undefined;
  const cardW = Math.min(width * 0.8, 340);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: TAB_BAR_SPACE + 24 }} showsVerticalScrollIndicator={false}>
      {/* Greeting */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push("/profile")} accessibilityRole="button" accessibilityLabel="Open profile">
          <Avatar name={user?.displayName ?? "Hiker"} size={52} ring="new" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <T variant="h1">Hello, {firstName(user?.displayName)}</T>
          <T variant="body" color={colors.muted}>
            Where would you like to go?
          </T>
        </View>
        <RoundButton icon="notifications-outline" label="Notifications" />
      </View>

      {/* Search + level chips */}
      <Pressable style={styles.search} onPress={() => router.push("/explore")} accessibilityRole="search" accessibilityLabel="Search trails">
        <Ionicons name="location-outline" size={18} color={colors.muted} />
        <T variant="body" color={colors.muted} style={{ flex: 1 }}>
          Batangas, Philippines
        </T>
        <Ionicons name="search" size={20} color={colors.light} />
      </Pressable>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14 }}>
        {(["all", "easy", "moderate", "hard"] as const).map((d) => (
          <Chip key={d} label={d === "all" ? "All trails" : d[0].toUpperCase() + d.slice(1)} selected={level === d} onPress={() => setLevel(d)} />
        ))}
      </ScrollView>

      {/* Featured trail carousel */}
      <FlatList
        horizontal
        data={shown}
        keyExtractor={(t) => t.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardW + 14}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingTop: 18 }}
        ListEmptyComponent={<T color={colors.muted}>{trails.loading ? "Loading trails..." : "No trails match this level."}</T>}
        renderItem={({ item }) => <TrailCard trail={item} width={cardW} height={360} />}
      />

      <View style={{ paddingHorizontal: 20 }}>
        {/* Next hike */}
        <SectionHeader title="Your next hike" action={next ? "All bookings" : undefined} onAction={() => router.push("/bookings")} />
        {next ? (
          <Pressable style={styles.card} onPress={() => router.push("/bookings")}>
            <View style={styles.dateBox}>
              <T variant="caps" color={colors.accent}>
                {new Date(next.dateKey + "T00:00:00").toLocaleDateString("en-PH", { month: "short" })}
              </T>
              <T variant="stat">{new Date(next.dateKey + "T00:00:00").getDate()}</T>
            </View>
            <View style={{ flex: 1 }}>
              <T variant="title">{nextTrail?.name ?? "Guided hike"}</T>
              <T variant="small" color={colors.muted}>
                {next.partySize} {next.partySize === 1 ? "hiker" : "hikers"} · Guide assigned
              </T>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        ) : (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <T variant="title">No hike planned yet</T>
              <T variant="small" color={colors.muted}>
                Pick a trail above and book a licensed local guide.
              </T>
            </View>
            <Button title="Explore" variant="secondary" onPress={() => router.push("/explore")} style={{ paddingVertical: 10, minHeight: 40 }} />
          </View>
        )}

        {/* This week */}
        <SectionHeader title="This week" action="Profile" onAction={() => router.push("/profile")} />
        <Pressable style={styles.card} onPress={() => router.push("/profile")}>
          <RingProgress size={84} stroke={9} progress={stats.weeklyKm / WEEKLY_GOAL_KM}>
            <T variant="statSm">{Math.round((stats.weeklyKm / WEEKLY_GOAL_KM) * 100)}%</T>
          </RingProgress>
          <View style={{ flex: 1 }}>
            <T variant="stat">
              {stats.weeklyKm} <T variant="body" color={colors.muted}>/ {WEEKLY_GOAL_KM} km</T>
            </T>
            <T variant="small" color={colors.muted}>
              {stats.weeklyHikes} {stats.weeklyHikes === 1 ? "hike" : "hikes"} this week · Level {stats.level}
            </T>
          </View>
        </Pressable>

        {/* Top guides */}
        <SectionHeader title="Top guides" />
      </View>
      <FlatList
        horizontal
        data={[...(guides.data ?? [])].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))}
        keyExtractor={(g) => g.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={({ item }) => (
          <Pressable style={styles.guide} onPress={() => router.push({ pathname: "/guide/[id]", params: { id: item.id } })} accessibilityRole="button" accessibilityLabel={`Guide ${item.name}`}>
            <Avatar name={item.name} size={56} />
            <T variant="title" style={{ marginTop: 8 }}>
              {item.name}
            </T>
            <T variant="small" color={colors.muted}>
              {item.yearsExperience ? `${item.yearsExperience} yrs experience` : "Local guide"}
            </T>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Stars value={item.rating ?? 0} size={12} />
              <T variant="small" color={colors.light}>
                {item.rating?.toFixed(1) ?? "New"}
              </T>
            </View>
          </Pressable>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 18 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surface2,
    paddingHorizontal: 16,
    height: 52,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.surface2,
    padding: 16,
  },
  dateBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" },
  guide: { width: 168, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.surface2, padding: 16 },
});

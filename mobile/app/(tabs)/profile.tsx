import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../src/components/Avatar";
import { Button } from "../../src/components/Button";
import { RingProgress } from "../../src/components/RingProgress";
import { T } from "../../src/components/T";
import { SectionHeader } from "../../src/components/ui";
import { useAuth } from "../../src/context/AuthContext";
import { useLoad } from "../../src/hooks/useLoad";
import { duration, km, timeAgo } from "../../src/lib/format";
import { WEEKLY_GOAL_KM, computeBadges, computeStats } from "../../src/lib/stats";
import { activitiesService, authService, socialService } from "../../src/services";
import { TAB_BAR_SPACE, colors, shared } from "../../src/theme";

export default function Profile() {
  const { user } = useAuth();
  const router = useRouter();
  const acts = useLoad(() => (user ? activitiesService.listMyActivities(user.uid) : Promise.resolve([])), [user?.uid]);
  const board = useLoad(() => socialService.leaderboard(), []);
  const following = useLoad(() => (user ? socialService.getFollowing(user.uid) : Promise.resolve([])), [user?.uid]);
  if (!user) return null;

  const activities = acts.data ?? [];
  const stats = computeStats(activities);
  const badges = computeBadges(activities, stats);
  const friends = (board.data ?? []).filter((p) => (following.data ?? []).includes(p.uid));
  const rank = (board.data ?? []).findIndex((p) => p.uid === user.uid) + 1;

  return (
    <ScrollView style={shared.screen} contentContainerStyle={{ padding: 20, paddingTop: 64, paddingBottom: TAB_BAR_SPACE + 20 }}>
      <View style={{ alignItems: "center" }}>
        <Avatar name={user.displayName} size={92} />
        <T variant="h1" style={{ marginTop: 12 }}>{user.displayName}</T>
        <T variant="small" color={colors.muted}>@{user.handle}</T>
        <View style={styles.levelWrap}>
          <View style={shared.between}>
            <T variant="small" color={colors.accent}>Level {stats.level}</T>
            <T variant="small" color={colors.muted}>{stats.xp} XP</T>
          </View>
          <View style={styles.levelTrack}>
            <View style={[styles.levelFill, { width: `${Math.round(stats.levelProgress * 100)}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.row}>
        {[
          [String(stats.hikes), "Hikes"],
          [`${stats.totalKm}`, "Total km"],
          [`${stats.totalElevationM}`, "Climb (m)"],
        ].map(([v, l]) => (
          <View key={l} style={styles.stat}>
            <T variant="stat">{v}</T>
            <T variant="small" color={colors.muted}>{l}</T>
          </View>
        ))}
      </View>

      <View style={[shared.card, { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 14 }]}>
        <RingProgress size={104} stroke={11} progress={stats.weeklyKm / WEEKLY_GOAL_KM}>
          <T variant="stat">{stats.weeklyKm}</T>
          <T variant="small" color={colors.muted}>km</T>
        </RingProgress>
        <View style={{ flex: 1 }}>
          <T variant="h2">Weekly goal</T>
          <T variant="small" color={colors.muted} style={{ marginTop: 2 }}>
            {stats.weeklyKm >= WEEKLY_GOAL_KM ? "Goal reached. Nice work!" : `${Math.round((WEEKLY_GOAL_KM - stats.weeklyKm) * 10) / 10} km to reach ${WEEKLY_GOAL_KM} km`}
          </T>
          <T variant="small" color={colors.accent} style={{ marginTop: 6 }}>
            {stats.weeklyHikes} {stats.weeklyHikes === 1 ? "hike" : "hikes"} this week
          </T>
        </View>
      </View>

      <SectionHeader title="Badges" />
      <View style={styles.badges}>
        {badges.map((b) => (
          <View key={b.id} style={[styles.badge, !b.earned && { opacity: 0.4 }]}>
            <View style={[styles.badgeIcon, b.earned && { backgroundColor: colors.light }]}>
              <Ionicons name={b.icon} size={24} color={b.earned ? colors.onLight : colors.muted} />
            </View>
            <T variant="small" style={{ textAlign: "center" }}>{b.title}</T>
          </View>
        ))}
      </View>

      <SectionHeader title="Friends" action="Find hikers" onAction={() => router.push("/people")} />
      {friends.length === 0 ? (
        <T variant="small" color={colors.muted}>Follow hikers to see them here.</T>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
          {friends.map((f) => (
            <View key={f.uid} style={{ alignItems: "center", width: 68 }}>
              <Avatar name={f.displayName} size={58} />
              <T variant="small" numberOfLines={1}>{f.displayName.split(" ")[0]}</T>
            </View>
          ))}
        </ScrollView>
      )}

      <SectionHeader title="Leaderboard" action="See all" onAction={() => router.push("/leaderboard")} />
      <T variant="small" color={colors.muted} style={{ marginBottom: 8 }}>
        {rank > 0 ? `You're #${rank} this week` : "Hike this week to join the ranking"}
      </T>

      <SectionHeader title="Recent hikes" />
      {activities.length === 0 && <T variant="small" color={colors.muted}>No hikes yet. Tap Record to start one.</T>}
      {activities.slice(0, 5).map((a) => (
        <View key={a.id} style={[shared.card, { marginBottom: 10 }]}>
          <View style={shared.between}>
            <T variant="title" style={{ flex: 1 }}>{a.trailName ?? "Free hike"}</T>
            <T variant="small" color={colors.muted}>{timeAgo(a.startedAt)}</T>
          </View>
          <T variant="small" color={colors.muted} style={{ marginTop: 2 }}>
            {km(a.distanceKm)} · {duration(a.durationSec)} · {Math.round(a.elevationGainM)} m climb
          </T>
        </View>
      ))}

      <View style={{ marginTop: 18, gap: 10 }}>
        <Button title="My bookings" icon="calendar-outline" variant="secondary" onPress={() => router.push("/bookings")} />
        <Button title="Saved trails" icon="bookmark-outline" variant="secondary" onPress={() => router.push("/saved")} />
        <Pressable accessibilityRole="button" onPress={() => authService.signOut()}>
          <T variant="title" color={colors.accent} style={{ textAlign: "center", paddingVertical: 14 }}>Sign out</T>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  levelWrap: { width: "70%", marginTop: 14 },
  levelTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surface2, marginTop: 6, overflow: "hidden" },
  levelFill: { height: 8, borderRadius: 4, backgroundColor: colors.light },
  row: { flexDirection: "row", gap: 10, marginTop: 22 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surface2, paddingVertical: 16, alignItems: "center" },
  badges: { flexDirection: "row", flexWrap: "wrap", rowGap: 14 },
  badge: { width: "33.33%", alignItems: "center", gap: 6 },
  badgeIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center" },
});

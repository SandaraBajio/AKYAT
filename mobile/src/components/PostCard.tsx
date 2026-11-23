import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { feedService } from "../services";
import { duration, km, timeAgo } from "../lib/format";
import { tap } from "../lib/haptics";
import { colors } from "../theme";
import type { Post } from "../types";
import { Avatar } from "./Avatar";
import { T } from "./T";
import { TrailImage } from "./TrailImage";

/** One feed post: author, photo, hike summary, like and comment buttons. */
export function PostCard({ post, onChange }: { post: Post; onChange?: (p: Post) => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const [p, setP] = useState(post);
  const liked = !!user && p.likedBy.includes(user.uid);

  async function like() {
    if (!user) return;
    tap();
    // Optimistic: flip the heart now, undo if the server call fails.
    const next = { ...p, likedBy: liked ? p.likedBy.filter((u) => u !== user.uid) : [...p.likedBy, user.uid] };
    setP(next);
    onChange?.(next);
    try {
      await feedService.toggleLike(p.id, user.uid);
    } catch {
      setP(p);
      onChange?.(p);
    }
  }
  const open = () => router.push({ pathname: "/post/[id]", params: { id: p.id } });

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Avatar name={p.authorName} size={40} />
        <View style={{ flex: 1 }}>
          <T variant="title">{p.authorName}</T>
          <T variant="small" color={colors.muted}>
            {p.trailName ? `${p.trailName} · ` : ""}
            {timeAgo(p.createdAt)}
          </T>
        </View>
      </View>

      <Pressable onPress={open} accessibilityLabel="Open post">
        <TrailImage source={p.photoUrls[0] ? { uri: p.photoUrls[0] } : undefined} seed={p.id} shade={false} style={styles.photo} />
      </Pressable>

      {p.activity && (
        <View style={styles.activity}>
          {[
            ["trail-sign-outline", km(p.activity.distanceKm)],
            ["time-outline", duration(p.activity.durationSec)],
            ["trending-up", `${Math.round(p.activity.elevationGainM)} m`],
          ].map(([icon, v]) => (
            <View key={v} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={15} color={colors.accent} />
              <T variant="small">{v}</T>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable onPress={like} hitSlop={8} accessibilityRole="button" accessibilityLabel={liked ? "Unlike" : "Like"} style={styles.act}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={26} color={liked ? colors.danger : colors.light} />
          <T variant="small">{p.likedBy.length}</T>
        </Pressable>
        <Pressable onPress={open} hitSlop={8} accessibilityRole="button" accessibilityLabel="Comments" style={styles.act}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.light} />
          <T variant="small">{p.commentCount}</T>
        </Pressable>
      </View>

      {!!p.caption && (
        <T variant="body" style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          <T variant="title">{p.authorName} </T>
          {p.caption}
        </T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 26, borderWidth: 1, borderColor: colors.surface2, overflow: "hidden" },
  head: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  photo: { height: 300, width: "100%" },
  activity: { flexDirection: "row", gap: 18, paddingHorizontal: 14, paddingTop: 12 },
  actions: { flexDirection: "row", gap: 20, padding: 14 },
  act: { flexDirection: "row", alignItems: "center", gap: 6 },
});

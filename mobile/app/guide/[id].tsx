import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Avatar } from "../../src/components/Avatar";
import { Button } from "../../src/components/Button";
import { Stars } from "../../src/components/Stars";
import { T } from "../../src/components/T";
import { StatTile } from "../../src/components/ui";
import { timeAgo } from "../../src/lib/format";
import { guidesService, trailsService } from "../../src/services";
import { colors, shared } from "../../src/theme";
import type { Guide, GuideReview, Trail } from "../../src/types";

export default function GuideProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [guide, setGuide] = useState<Guide | null | undefined>(undefined);
  const [reviews, setReviews] = useState<GuideReview[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);

  useEffect(() => {
    guidesService.getGuide(id).then(setGuide).catch(() => setGuide(null));
    guidesService.listGuideReviews(id).then(setReviews).catch(() => {});
    trailsService.listTrails().then(setTrails).catch(() => {});
  }, [id]);

  if (guide === undefined) return <ActivityIndicator style={{ marginTop: 60 }} color={colors.accent} />;
  if (guide === null) return <T color="#FFB4A8" style={{ padding: 20 }}>Guide not found.</T>;
  const mine = trails.filter((t) => guide.trailIds.includes(t.id));

  return (
    <ScrollView style={shared.screen} contentContainerStyle={{ padding: 20 }}>
      <View style={{ alignItems: "center" }}>
        <Avatar name={guide.name} uri={guide.photoUrl} size={96} />
        <T variant="h1" style={{ marginTop: 12 }}>{guide.name}</T>
        <T variant="small" color={colors.muted}>Licensed local guide</T>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
          <Stars value={guide.rating ?? 0} size={16} />
          <T variant="small" color={colors.muted}>
            {guide.rating?.toFixed(1) ?? "New"} ({guide.reviewCount ?? reviews.length})
          </T>
        </View>
      </View>

      <View style={styles.stats}>
        <StatTile icon="ribbon-outline" label="Experience" value={guide.yearsExperience != null ? `${guide.yearsExperience} yrs` : "--"} />
        <StatTile icon="flag-outline" label="Hikes led" value={String(guide.assignedCount)} />
        <StatTile icon="trail-sign-outline" label="Trails" value={String(mine.length)} />
      </View>

      {!!guide.bio && (
        <>
          <T variant="h2">About</T>
          <T variant="body" color="rgba(218,241,222,0.85)" style={{ marginTop: 6 }}>{guide.bio}</T>
        </>
      )}

      {mine.length > 0 && (
        <>
          <T variant="caps" color={colors.muted} style={{ marginTop: 24, marginBottom: 10 }}>Guides these trails</T>
          {mine.map((t) => (
            <Button key={t.id} title={t.name} variant="secondary" iconRight="chevron-forward" style={{ marginBottom: 8 }} onPress={() => router.push({ pathname: "/trail/[id]", params: { id: t.id } })} />
          ))}
        </>
      )}

      <T variant="h2" style={{ marginTop: 24, marginBottom: 10 }}>Reviews</T>
      {reviews.length === 0 && <T color={colors.muted}>No reviews yet.</T>}
      {reviews.map((r) => (
        <View key={r.id} style={[shared.card, { marginBottom: 12 }]}>
          <View style={[shared.between]}>
            <T variant="title">{r.hikerName}</T>
            <T variant="small" color={colors.muted}>{timeAgo(r.createdAt)}</T>
          </View>
          <Stars value={r.rating} size={14} />
          {r.tags.length > 0 && (
            <View style={styles.tags}>
              {r.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <T variant="small" color={colors.accent}>{t}</T>
                </View>
              ))}
            </View>
          )}
          {!!r.comment && <T variant="body" style={{ marginTop: 8 }}>{r.comment}</T>}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", gap: 10, marginVertical: 20 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  tag: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
});

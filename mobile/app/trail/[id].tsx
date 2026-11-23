import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../src/components/Avatar";
import { Button } from "../../src/components/Button";
import { ElevationChart } from "../../src/components/ElevationChart";
import { RouteMap } from "../../src/components/RouteMap";
import { Stars } from "../../src/components/Stars";
import { T } from "../../src/components/T";
import { TrailImage } from "../../src/components/TrailImage";
import { PillTabs, RatingBadge, RoundButton, StatTile } from "../../src/components/ui";
import { trailPhotos } from "../../src/data/trailImages";
import { guidesService, reviewsService, trailsService } from "../../src/services";
import { useSaved } from "../../src/state/saved";
import { colors, difficultyStyle, peso, shared } from "../../src/theme";
import type { Guide, Review, Trail } from "../../src/types";

type TabKey = "details" | "map" | "reviews" | "photos";
const TABS: { key: TabKey; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "map", label: "Map" },
  { key: "reviews", label: "Reviews" },
  { key: "photos", label: "Photos" },
];

export default function TrailDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSaved, toggle } = useSaved();
  const [trail, setTrail] = useState<Trail | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [tab, setTab] = useState<TabKey>("details");

  useEffect(() => {
    trailsService.getTrail(id).then(setTrail).catch(() => setTrail(null));
    reviewsService.listReviews(id).then(setReviews).catch(() => {});
    guidesService.listGuides().then((g) => setGuides(g.filter((x) => x.trailIds.includes(id)))).catch(() => {});
  }, [id]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (trail === undefined) return <ActivityIndicator style={{ marginTop: 80 }} color={colors.accent} />;
  if (trail === null) {
    return (
      <View style={[shared.screen, { padding: 20, paddingTop: insets.top + 20 }]}>
        <RoundButton icon="arrow-back" label="Back" onPress={goBack} />
        <T color="#FFB4A8" style={{ marginTop: 20 }}>
          Trail not found.
        </T>
      </View>
    );
  }

  const photos = trailPhotos(trail);
  const diff = trail.difficulty ? difficultyStyle[trail.difficulty] : null;
  const summit = trail.elevationProfile?.length ? Math.max(...trail.elevationProfile) : undefined;

  return (
    <View style={shared.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <TrailImage source={photos[0]} seed={trail.id} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <View style={styles.heroTop}>
            <RoundButton icon="arrow-back" label="Back" onPress={goBack} />
            <RoundButton icon={isSaved(trail.id) ? "bookmark" : "bookmark-outline"} label="Save trail" onPress={() => toggle(trail.id)} active={isSaved(trail.id)} />
          </View>
        </TrailImage>

        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <T variant="h1" style={{ textAlign: "center" }}>
            {trail.name}
          </T>
          <T variant="small" color={colors.muted} style={{ textAlign: "center", marginTop: 2 }}>
            {summit != null ? `${summit.toLocaleString()} meters · ` : ""}
            {trail.location ?? "Batangas, Philippines"}
          </T>
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <RatingBadge rating={trail.rating} count={trail.reviewCount} />
          </View>

          <View style={styles.stats}>
            <StatTile icon="time-outline" label="Duration" value={trail.durationHours != null ? `${trail.durationHours}h` : "--"} />
            <StatTile icon="trail-sign-outline" label="Distance" value={trail.distanceKm != null ? `${trail.distanceKm}km` : "--"} />
            <StatTile icon="speedometer-outline" label="Level" value={diff?.label ?? "--"} />
          </View>

          <PillTabs tabs={TABS} active={tab} onChange={setTab} />

          <View style={{ paddingTop: 20 }}>
            {tab === "details" && (
              <>
                <T variant="h2">About this trail</T>
                <T variant="body" color="rgba(218,241,222,0.85)" style={{ marginTop: 8 }}>
                  {trail.description ?? "Trail description coming soon."}
                </T>

                <T variant="caps" color={colors.muted} style={{ marginTop: 24, marginBottom: 12 }}>
                  Included
                </T>
                {["Licensed local guide, assigned fairly from our roster", `Groups of up to ${trail.maxGroupSize} hikers`, "Pay with GCash, Maya or card"].map((line) => (
                  <View key={line} style={styles.bullet}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                    <T variant="body" style={{ flex: 1 }}>
                      {line}
                    </T>
                  </View>
                ))}

                {guides.length > 0 && (
                  <>
                    <T variant="caps" color={colors.muted} style={{ marginTop: 24, marginBottom: 12 }}>
                      Guides on this trail
                    </T>
                    {guides.map((g) => (
                      <Pressable key={g.id} style={styles.guideRow} onPress={() => router.push({ pathname: "/guide/[id]", params: { id: g.id } })}>
                        <Avatar name={g.name} size={44} />
                        <View style={{ flex: 1 }}>
                          <T variant="title">{g.name}</T>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Stars value={g.rating ?? 0} size={12} />
                            <T variant="small" color={colors.muted}>
                              {g.rating?.toFixed(1) ?? "New"} ({g.reviewCount ?? 0})
                            </T>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                      </Pressable>
                    ))}
                  </>
                )}
              </>
            )}

            {tab === "map" && (
              <>
                <RouteMap route={trail.route} summitM={summit} distanceKm={trail.distanceKm} height={300} />
                <View style={[shared.card, { marginTop: 14 }]}>
                  <View style={shared.between}>
                    <T variant="h2">Elevation</T>
                    <View style={styles.pill}>
                      <T variant="small">Out and back</T>
                    </View>
                  </View>
                  <View style={{ height: 14 }} />
                  <ElevationChart profile={trail.elevationProfile} distanceKm={trail.distanceKm} />
                </View>
              </>
            )}

            {tab === "reviews" && (
              <>
                <View style={[shared.row, { gap: 14, marginBottom: 14 }]}>
                  <T variant="display">{trail.rating?.toFixed(1) ?? "--"}</T>
                  <View>
                    <Stars value={trail.rating ?? 0} size={16} />
                    <T variant="small" color={colors.muted}>
                      {trail.reviewCount ?? reviews.length} reviews
                    </T>
                  </View>
                </View>
                <Button title="Write a review" icon="create-outline" variant="secondary" onPress={() => router.push({ pathname: "/rate", params: { trailId: trail.id } })} style={{ marginBottom: 16 }} />
                {reviews.length === 0 && (
                  <T color={colors.muted}>No reviews yet. Be the first after your hike.</T>
                )}
                {reviews.map((r) => (
                  <View key={r.id} style={[shared.card, { marginBottom: 12 }]}>
                    <View style={[shared.row, { gap: 10 }]}>
                      <Avatar name={r.userName} size={40} />
                      <View style={{ flex: 1 }}>
                        <T variant="title">{r.userName}</T>
                        <T variant="small" color={colors.muted}>
                          {new Date(r.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        </T>
                      </View>
                      <RatingBadge rating={r.rating} />
                    </View>
                    <T variant="body" style={{ marginTop: 10 }}>
                      {r.comment}
                    </T>
                  </View>
                ))}
              </>
            )}

            {tab === "photos" && (
              <>
                <View style={styles.grid}>
                  {(photos.length > 0 ? photos : [undefined, undefined, undefined, undefined]).map((src, i) => (
                    <TrailImage key={i} source={src} seed={`${trail.id}-${i}`} shade={false} style={[styles.tile, i % 3 === 0 && { height: 220 }]} />
                  ))}
                </View>
                {photos.length === 0 && (
                  <T variant="small" color={colors.muted} style={{ marginTop: 10 }}>
                    Photos you add in src/data/trailImages.ts appear here.
                  </T>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + 14 }]}>
        <Button title="Track hike" icon="play" variant="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: "/record", params: { trailId: trail.id } })} />
        <Button title={`Book · ${peso(trail.pricePerPerson)}`} style={{ flex: 1.5 }} onPress={() => router.push({ pathname: "/booking/[trailId]", params: { trailId: trail.id } })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { height: 400, paddingHorizontal: 16 },
  heroTop: { flexDirection: "row", justifyContent: "space-between" },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 34, borderTopRightRadius: 34, marginTop: -34, padding: 20, paddingTop: 12 },
  grabber: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 14 },
  stats: { flexDirection: "row", gap: 10, marginVertical: 20 },
  bullet: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  guideRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surface2, padding: 12, marginBottom: 10 },
  pill: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "48%", height: 150, borderRadius: 20 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 14, backgroundColor: "rgba(5,31,32,0.96)", borderTopWidth: 1, borderTopColor: colors.surface2 },
});

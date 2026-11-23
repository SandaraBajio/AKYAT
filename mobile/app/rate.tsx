import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { Chip } from "../src/components/ui";
import { StarsInput } from "../src/components/Stars";
import { T } from "../src/components/T";
import { useAuth } from "../src/context/AuthContext";
import { success } from "../src/lib/haptics";
import { guidesService, reviewsService, ServiceError, trailsService } from "../src/services";
import { colors, shared } from "../src/theme";
import type { Guide, Trail } from "../src/types";

const TAGS = ["Knowledgeable", "Friendly", "Safe", "On time", "Great photographer", "Patient"];

export default function Rate() {
  const { trailId, guideId, bookingId } = useLocalSearchParams<{ trailId?: string; guideId?: string; bookingId?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [trail, setTrail] = useState<Trail | null>(null);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [trailStars, setTrailStars] = useState(0);
  const [trailText, setTrailText] = useState("");
  const [guideStars, setGuideStars] = useState(0);
  const [guideText, setGuideText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (trailId) trailsService.getTrail(trailId).then(setTrail).catch(() => {});
    if (guideId) guidesService.getGuide(guideId).then(setGuide).catch(() => {});
  }, [trailId, guideId]);

  async function submit() {
    if (!user) return;
    if ((trailId && !trailStars) && (guideId && !guideStars)) {
      setError("Tap the stars to rate at least one.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (trailId && trailStars) await reviewsService.createTrailReview(user, { trailId, rating: trailStars, comment: trailText.trim() });
      if (guideId && guideStars) await reviewsService.createGuideReview(user, { guideId, bookingId: bookingId || undefined, rating: guideStars, tags, comment: guideText.trim() });
      success();
      router.back();
    } catch (e) {
      setError(e instanceof ServiceError ? e.message : "Could not send your rating.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      {trailId && (
        <View style={shared.card}>
          <T variant="caps" color={colors.muted}>Rate the trail</T>
          <T variant="h2" style={{ marginTop: 4 }}>{trail?.name ?? "..."}</T>
          <View style={{ alignItems: "center", marginVertical: 14 }}>
            <StarsInput value={trailStars} onChange={setTrailStars} />
          </View>
          <Input multiline placeholder="How was the trail? Conditions, views, difficulty..." value={trailText} onChangeText={setTrailText} maxLength={500} />
        </View>
      )}

      {guideId && (
        <View style={[shared.card, { marginTop: 16 }]}>
          <T variant="caps" color={colors.muted}>Rate your guide</T>
          <T variant="h2" style={{ marginTop: 4 }}>{guide?.name ?? "..."}</T>
          <View style={{ alignItems: "center", marginVertical: 14 }}>
            <StarsInput value={guideStars} onChange={setGuideStars} />
          </View>
          <View style={styles.tags}>
            {TAGS.map((t) => (
              <Chip key={t} label={t} selected={tags.includes(t)} onPress={() => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))} />
            ))}
          </View>
          <View style={{ marginTop: 12 }}>
            <Input multiline placeholder="Anything to add about your guide?" value={guideText} onChangeText={setGuideText} maxLength={500} />
          </View>
        </View>
      )}

      {error && (
        <T variant="small" color="#FFB4A8" style={{ marginTop: 12 }}>
          {error}
        </T>
      )}
      <Button title="Send rating" loading={busy} style={{ marginTop: 20 }} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});

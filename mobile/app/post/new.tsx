import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { T } from "../../src/components/T";
import { useAuth } from "../../src/context/AuthContext";
import { success } from "../../src/lib/haptics";
import { feedService, ServiceError } from "../../src/services";
import { colors, shared } from "../../src/theme";

export default function NewPost() {
  const p = useLocalSearchParams<{ story?: string; trailId?: string; trailName?: string; distanceKm?: string; durationSec?: string; elevationGainM?: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [caption, setCaption] = useState("");
  const [asStory, setAsStory] = useState(p.story === "1");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasHike = !!p.distanceKm;

  async function pick() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: asStory ? [9, 16] : [4, 5] });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  }

  async function submit() {
    if (!user) return;
    if (!photoUri && !caption.trim()) {
      setError("Add a photo or write something first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await feedService.createPost(user, {
        caption: caption.trim(),
        photoUri,
        trailId: p.trailId || undefined,
        trailName: p.trailName || undefined,
        activity: hasHike ? { distanceKm: Number(p.distanceKm), durationSec: Number(p.durationSec), elevationGainM: Number(p.elevationGainM) } : undefined,
        asStory,
      });
      success();
      router.replace("/community");
    } catch (e) {
      setError(e instanceof ServiceError ? e.message : "Could not post. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={shared.screen} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Pressable onPress={pick} accessibilityRole="button" accessibilityLabel="Choose a photo" style={styles.drop}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <>
            <Ionicons name="image-outline" size={40} color={colors.accent} />
            <T variant="title" style={{ marginTop: 8 }}>Add a photo</T>
            <T variant="small" color={colors.muted}>Tap to choose from your library</T>
          </>
        )}
      </Pressable>

      <View style={{ marginTop: 16 }}>
        <Input multiline placeholder="Write a caption..." value={caption} onChangeText={setCaption} maxLength={500} />
      </View>

      {(p.trailName || hasHike) && (
        <View style={[shared.card, { marginTop: 14, gap: 4 }]}>
          {!!p.trailName && <T variant="small" color={colors.muted}>Tagged trail: <T variant="small">{p.trailName}</T></T>}
          {hasHike && <T variant="small" color={colors.muted}>Hike attached: <T variant="small">{Number(p.distanceKm).toFixed(1)} km · {Math.round(Number(p.elevationGainM))} m climb</T></T>}
        </View>
      )}

      <View style={[shared.card, shared.between, { marginTop: 14 }]}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <T variant="title">Post as a story</T>
          <T variant="small" color={colors.muted}>Disappears after 24 hours</T>
        </View>
        <Switch value={asStory} onValueChange={setAsStory} trackColor={{ true: colors.accent, false: colors.line }} thumbColor={colors.light} />
      </View>

      {error && (
        <T variant="small" color="#FFB4A8" style={{ marginTop: 12 }}>
          {error}
        </T>
      )}
      <Button title={asStory ? "Share story" : "Post"} loading={busy} style={{ marginTop: 20 }} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  drop: { height: 320, borderRadius: 26, backgroundColor: colors.surface, borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.line, alignItems: "center", justifyContent: "center", overflow: "hidden" },
});

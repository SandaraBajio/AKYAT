import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../src/components/Avatar";
import { RoundButton } from "../../src/components/ui";
import { T } from "../../src/components/T";
import { TrailImage } from "../../src/components/TrailImage";
import { timeAgo } from "../../src/lib/format";
import { feedService } from "../../src/services";
import { colors } from "../../src/theme";
import type { Story } from "../../src/types";

const SECONDS = 5;

/** Full-screen story. Auto-advances after 5 seconds; tap the right half for next, left half for previous. */
export default function StoryViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stories, setStories] = useState<Story[]>([]);
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    feedService.listStories().then((list) => {
      setStories(list);
      const i = list.findIndex((s) => s.id === id);
      setIndex(i >= 0 ? i : 0);
    }).catch(() => {});
  }, [id]);

  const close = () => (router.canGoBack() ? router.back() : router.replace("/community"));
  const story = stories[index];

  useEffect(() => {
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(t);
  }, [index]);

  useEffect(() => {
    if (elapsed < SECONDS || !stories.length) return;
    if (index < stories.length - 1) setIndex(index + 1);
    else close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  if (!story) return <View style={styles.root} />;

  return (
    <View style={styles.root}>
      <TrailImage source={story.photoUrl ? { uri: story.photoUrl } : undefined} seed={story.id} style={StyleSheet.absoluteFill} />
      <View style={[styles.bars, { top: insets.top + 8 }]}>
        {stories.map((s, i) => (
          <View key={s.id} style={styles.track}>
            <View style={[styles.fill, { width: `${i < index ? 100 : i === index ? Math.min(100, (elapsed / SECONDS) * 100) : 0}%` }]} />
          </View>
        ))}
      </View>
      <View style={[styles.head, { top: insets.top + 24 }]}>
        <Avatar name={story.authorName} size={38} />
        <View style={{ flex: 1 }}>
          <T variant="title" color={colors.white}>{story.authorName}</T>
          <T variant="small" color="rgba(255,255,255,0.8)">
            {story.trailName ? `${story.trailName} · ` : ""}
            {timeAgo(story.createdAt)}
          </T>
        </View>
        <RoundButton icon="close" label="Close story" onPress={close} />
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={{ flex: 1, flexDirection: "row", marginTop: insets.top + 80, marginBottom: 120 }}>
          <Pressable style={{ flex: 1 }} accessibilityLabel="Previous story" onPress={() => (index > 0 ? setIndex(index - 1) : setElapsed(0))} />
          <Pressable style={{ flex: 1 }} accessibilityLabel="Next story" onPress={() => (index < stories.length - 1 ? setIndex(index + 1) : close())} />
        </View>
      </View>

      {!!story.caption && (
        <View style={[styles.caption, { bottom: insets.bottom + 30 }]}>
          <T variant="body" color={colors.white}>{story.caption}</T>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  bars: { position: "absolute", left: 12, right: 12, flexDirection: "row", gap: 4 },
  track: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden" },
  fill: { height: 3, backgroundColor: "#fff" },
  head: { position: "absolute", left: 14, right: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  caption: { position: "absolute", left: 20, right: 20, backgroundColor: "rgba(5,31,32,0.55)", padding: 14, borderRadius: 18 },
});

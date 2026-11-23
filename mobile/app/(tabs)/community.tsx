import { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "../../src/components/Avatar";
import { PostCard } from "../../src/components/PostCard";
import { T } from "../../src/components/T";
import { useAuth } from "../../src/context/AuthContext";
import { useLoad } from "../../src/hooks/useLoad";
import { feedService } from "../../src/services";
import { TAB_BAR_SPACE, colors, shared } from "../../src/theme";

export default function Community() {
  const router = useRouter();
  const { user } = useAuth();
  const stories = useLoad(() => feedService.listStories(), []);
  const posts = useLoad(() => feedService.listPosts(), []);
  const refresh = useCallback(async () => {
    await Promise.all([stories.reload(), posts.reload()]);
  }, [stories, posts]);

  const header = (
    <View>
      <View style={[shared.between, { paddingHorizontal: 20, paddingTop: 64 }]}>
        <T variant="h1">Community</T>
        <Pressable onPress={() => router.push("/people")} accessibilityRole="button" accessibilityLabel="Find hikers" hitSlop={8}>
          <Ionicons name="people-outline" size={26} color={colors.light} />
        </Pressable>
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={stories.data ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}
        ListHeaderComponent={
          <Pressable style={styles.story} onPress={() => router.push({ pathname: "/post/new", params: { story: "1" } })} accessibilityRole="button" accessibilityLabel="Add your story">
            <View style={styles.add}>
              <Ionicons name="add" size={30} color={colors.onLight} />
            </View>
            <T variant="small" numberOfLines={1}>Your story</T>
          </Pressable>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.story} onPress={() => router.push({ pathname: "/story/[id]", params: { id: item.id } })} accessibilityRole="button" accessibilityLabel={`Story by ${item.authorName}`}>
            <Avatar name={item.authorName} size={68} ring={item.authorId === user?.uid ? "seen" : "new"} />
            <T variant="small" numberOfLines={1} style={{ maxWidth: 70 }}>
              {item.authorName.split(" ")[0]}
            </T>
          </Pressable>
        )}
      />
    </View>
  );

  return (
    <FlatList
      style={shared.screen}
      data={posts.data ?? []}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={header}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + 20 }}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.accent} />}
      ListEmptyComponent={
        <T color={colors.muted} style={{ textAlign: "center", marginTop: 30 }}>
          {posts.loading ? "Loading..." : "No posts yet. Share the first moment!"}
        </T>
      }
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: 20 }}>
          <PostCard post={item} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  story: { alignItems: "center", gap: 6, width: 72 },
  add: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.light, alignItems: "center", justifyContent: "center" },
});

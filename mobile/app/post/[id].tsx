import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../src/components/Avatar";
import { Input } from "../../src/components/Input";
import { PostCard } from "../../src/components/PostCard";
import { T } from "../../src/components/T";
import { useAuth } from "../../src/context/AuthContext";
import { timeAgo } from "../../src/lib/format";
import { feedService } from "../../src/services";
import { colors, shared } from "../../src/theme";
import type { Post, PostComment } from "../../src/types";

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [post, setPost] = useState<Post | null | undefined>(undefined);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const [posts, cs] = await Promise.all([feedService.listPosts(), feedService.listComments(id)]);
    setPost(posts.find((x) => x.id === id) ?? null);
    setComments(cs);
  }, [id]);
  useEffect(() => {
    load().catch(() => setPost(null));
  }, [load]);

  async function send() {
    if (!user || !text.trim() || sending) return;
    setSending(true);
    try {
      const c = await feedService.addComment(id, user, text.trim());
      setComments((prev) => [...prev, c]);
      setPost((p) => (p ? { ...p, commentCount: p.commentCount + 1 } : p));
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (post === undefined) return <ActivityIndicator style={{ marginTop: 60 }} color={colors.accent} />;
  if (post === null) return <T color="#FFB4A8" style={{ padding: 20 }}>Post not found.</T>;

  return (
    <KeyboardAvoidingView style={shared.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 20, gap: 14 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 6 }}>
            <PostCard post={post} />
            <T variant="caps" color={colors.muted} style={{ marginTop: 22 }}>
              Comments
            </T>
          </View>
        }
        ListEmptyComponent={<T variant="small" color={colors.muted}>No comments yet. Say something nice.</T>}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Avatar name={item.authorName} size={36} />
            <View style={{ flex: 1 }}>
              <T variant="small">
                <T variant="title" style={{ fontSize: 14 }}>{item.authorName} </T>
                <T variant="small" color={colors.muted}>{timeAgo(item.createdAt)}</T>
              </T>
              <T variant="body">{item.text}</T>
            </View>
          </View>
        )}
      />
      <View style={[styles.bar, { paddingBottom: insets.bottom + 10 }]}>
        <Input placeholder="Add a comment..." value={text} onChangeText={setText} onSubmitEditing={send} returnKeyType="send" style={{ flex: 1 }} />
        <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send comment" style={[styles.send, !text.trim() && { opacity: 0.4 }]} disabled={!text.trim() || sending}>
          <Ionicons name="arrow-up" size={22} color={colors.onLight} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.surface2, backgroundColor: colors.bg },
  send: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.light, alignItems: "center", justifyContent: "center" },
});

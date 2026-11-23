import { useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Avatar } from "../src/components/Avatar";
import { T } from "../src/components/T";
import { useAuth } from "../src/context/AuthContext";
import { useLoad } from "../src/hooks/useLoad";
import { tap } from "../src/lib/haptics";
import { socialService } from "../src/services";
import { colors, shared } from "../src/theme";

export default function People() {
  const { user } = useAuth();
  const people = useLoad(() => (user ? socialService.listProfiles(user.uid) : Promise.resolve([])), [user?.uid]);
  const follow = useLoad(() => (user ? socialService.getFollowing(user.uid) : Promise.resolve([])), [user?.uid]);
  const [override, setOverride] = useState<Record<string, boolean>>({});
  if (!user) return null;

  const isFollowing = (uid: string) => override[uid] ?? (follow.data ?? []).includes(uid);

  async function toggle(uid: string) {
    tap();
    const next = !isFollowing(uid);
    setOverride((o) => ({ ...o, [uid]: next }));
    try {
      await socialService.setFollowing(user!.uid, uid, next);
    } catch {
      setOverride((o) => ({ ...o, [uid]: !next }));
    }
  }

  return (
    <FlatList
      style={shared.screen}
      data={people.data ?? []}
      keyExtractor={(p) => p.uid}
      contentContainerStyle={{ padding: 20, gap: 10 }}
      ListEmptyComponent={<T color={colors.muted}>{people.loading ? "Loading..." : "No other hikers yet."}</T>}
      renderItem={({ item }) => {
        const on = isFollowing(item.uid);
        return (
          <View style={[shared.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
            <Avatar name={item.displayName} size={48} />
            <View style={{ flex: 1 }}>
              <T variant="title">{item.displayName}</T>
              <T variant="small" color={colors.muted}>
                @{item.handle} · {item.hikes} hikes · {item.totalKm} km
              </T>
            </View>
            <Pressable onPress={() => toggle(item.uid)} accessibilityRole="button" accessibilityLabel={on ? `Unfollow ${item.displayName}` : `Follow ${item.displayName}`} style={[styles.btn, on && styles.btnOn]}>
              <T variant="small" color={on ? colors.light : colors.onLight}>{on ? "Following" : "Follow"}</T>
            </Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.light, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  btnOn: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.line },
});

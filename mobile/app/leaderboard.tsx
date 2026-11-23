import { FlatList, View } from "react-native";
import { Avatar } from "../src/components/Avatar";
import { T } from "../src/components/T";
import { useAuth } from "../src/context/AuthContext";
import { useLoad } from "../src/hooks/useLoad";
import { socialService } from "../src/services";
import { colors, shared } from "../src/theme";

const MEDAL = ["#F2C14E", "#C9D3CC", "#C98B5A"];

export default function Leaderboard() {
  const { user } = useAuth();
  const { data } = useLoad(() => socialService.leaderboard(), []);

  return (
    <FlatList
      style={shared.screen}
      data={data ?? []}
      keyExtractor={(p) => p.uid}
      contentContainerStyle={{ padding: 20, gap: 10 }}
      ListHeaderComponent={
        <T variant="small" color={colors.muted} style={{ marginBottom: 6 }}>
          Distance hiked in the last 7 days
        </T>
      }
      renderItem={({ item, index }) => {
        const me = item.uid === user?.uid;
        return (
          <View style={[shared.card, { flexDirection: "row", alignItems: "center", gap: 12 }, me && { borderColor: colors.accent }]}>
            <T variant="h2" color={MEDAL[index] ?? colors.muted} style={{ width: 28, textAlign: "center" }}>
              {index + 1}
            </T>
            <Avatar name={item.displayName} size={44} />
            <View style={{ flex: 1 }}>
              <T variant="title">{me ? "You" : item.displayName}</T>
              <T variant="small" color={colors.muted}>@{item.handle}</T>
            </View>
            <T variant="stat">{item.weeklyKm} km</T>
          </View>
        );
      }}
    />
  );
}

import { FlatList, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { T } from "../src/components/T";
import { TrailCard } from "../src/components/TrailCard";
import { useLoad } from "../src/hooks/useLoad";
import { trailsService } from "../src/services";
import { useSaved } from "../src/state/saved";
import { colors, shared } from "../src/theme";

export default function Saved() {
  const { ids } = useSaved();
  const { data } = useLoad(() => trailsService.listTrails(), []);
  const saved = (data ?? []).filter((t) => ids.includes(t.id));

  return (
    <FlatList
      style={shared.screen}
      data={saved}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ padding: 20, gap: 16 }}
      ListEmptyComponent={
        <View style={{ alignItems: "center", marginTop: 60 }}>
          <Ionicons name="bookmark-outline" size={44} color={colors.muted} />
          <T variant="title" style={{ marginTop: 10 }}>
            Nothing saved yet
          </T>
          <T variant="small" color={colors.muted}>
            Tap the bookmark on any trail to keep it here.
          </T>
        </View>
      }
      renderItem={({ item }) => <TrailCard trail={item} height={260} />}
    />
  );
}

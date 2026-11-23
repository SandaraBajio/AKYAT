import { useMemo } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../../src/components/Input";
import { Screen } from "../../src/components/Screen";
import { T } from "../../src/components/T";
import { TrailCard } from "../../src/components/TrailCard";
import { Chip } from "../../src/components/ui";
import { useLoad } from "../../src/hooks/useLoad";
import { trailsService } from "../../src/services";
import { activeFilterCount, applyFilters, setFilters, useFilters } from "../../src/state/filters";
import { TAB_BAR_SPACE, colors } from "../../src/theme";

export default function Explore() {
  const router = useRouter();
  const filters = useFilters();
  const { data: trails, loading, error } = useLoad(() => trailsService.listTrails(), []);

  const visible = useMemo(() => (trails ? applyFilters(trails, filters) : []), [trails, filters]);
  const count = activeFilterCount(filters);

  return (
    <Screen title="Explore" subtitle={trails ? `${visible.length} trails found` : "Loading..."}>
      <View style={styles.searchRow}>
        <Input icon="search" placeholder="Search trails or places" value={filters.query} onChangeText={(query) => setFilters({ query })} style={{ flex: 1 }} />
        <Pressable style={styles.filterBtn} onPress={() => router.push("/filters")} accessibilityRole="button" accessibilityLabel="Open filters">
          <Ionicons name="options" size={22} color={colors.onLight} />
          {count > 0 && (
            <View style={styles.dot}>
              <T variant="small" color={colors.onLight} style={{ fontSize: 11 }}>
                {count}
              </T>
            </View>
          )}
        </Pressable>
      </View>

      <View style={{ height: 46 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {(["all", "easy", "moderate", "hard"] as const).map((d) => (
            <Chip key={d} label={d === "all" ? "All" : d[0].toUpperCase() + d.slice(1)} selected={filters.difficulty === d} onPress={() => setFilters({ difficulty: d })} />
          ))}
        </ScrollView>
      </View>

      {error ? (
        <T color="#FFB4A8" style={{ padding: 20 }}>
          {error}
        </T>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(t) => t.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: TAB_BAR_SPACE + 20, gap: 16 }}
          ListEmptyComponent={
            <T color={colors.muted}>
              {loading ? "Loading trails..." : !trails || trails.length === 0 ? "No trails yet. Run the seed script (see README)." : "No trails match your filters."}
            </T>
          }
          renderItem={({ item }) => <TrailCard trail={item} height={300} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: 10, paddingHorizontal: 20, marginBottom: 12 },
  filterBtn: { width: 54, borderRadius: 16, backgroundColor: colors.light, alignItems: "center", justifyContent: "center" },
  dot: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.bg,
  },
});

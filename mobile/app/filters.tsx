import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../src/components/Button";
import { T } from "../src/components/T";
import { Chip } from "../src/components/ui";
import { DEFAULT_FILTERS, setFilters, useFilters } from "../src/state/filters";
import { colors } from "../src/theme";

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ marginBottom: 22 }}>
    <T variant="caps" color={colors.muted} style={{ marginBottom: 10 }}>
      {title}
    </T>
    <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 8 }}>{children}</View>
  </View>
);

export default function Filters() {
  const router = useRouter();
  const f = useFilters();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Group title="Difficulty">
          {(["all", "easy", "moderate", "hard"] as const).map((d) => (
            <Chip key={d} label={d === "all" ? "Any" : d[0].toUpperCase() + d.slice(1)} selected={f.difficulty === d} onPress={() => setFilters({ difficulty: d })} />
          ))}
        </Group>
        <Group title="Price per person (max)">
          {[null, 30000, 40000, 50000].map((p) => (
            <Chip key={String(p)} label={p == null ? "Any" : `₱${p / 100}`} selected={f.maxPrice === p} onPress={() => setFilters({ maxPrice: p })} />
          ))}
        </Group>
        <Group title="Rating (min)">
          {[0, 4, 4.5, 4.8].map((r) => (
            <Chip key={r} label={r === 0 ? "Any" : `${r}+ stars`} selected={f.minRating === r} onPress={() => setFilters({ minRating: r })} />
          ))}
        </Group>
        <Group title="Trail length (max)">
          {[null, 4, 7, 10].map((d) => (
            <Chip key={String(d)} label={d == null ? "Any" : `${d} km`} selected={f.maxDistanceKm === d} onPress={() => setFilters({ maxDistanceKm: d })} />
          ))}
        </Group>
        {/* TODO (Data teammate): location filter (municipality) and "within X km of me" once expo-location is wired in. */}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: colors.surface2 }}>
        <Button title="Reset" variant="secondary" style={{ flex: 1 }} onPress={() => setFilters({ ...DEFAULT_FILTERS, query: f.query })} />
        <Button title="Apply filters" style={{ flex: 2 }} onPress={() => router.back()} />
      </View>
    </View>
  );
}

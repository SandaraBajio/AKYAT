import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tap } from "../lib/haptics";
import { colors, radius } from "../theme";
import { T } from "./T";

type Icon = keyof typeof Ionicons.glyphMap;

/** Outlined pill. Selected = mint outline + tint, like the category chips in the reference. */
export function Chip({ label, selected, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: Icon }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[styles.chip, selected && styles.chipOn]}
    >
      {icon && <Ionicons name={icon} size={14} color={selected ? colors.light : colors.muted} />}
      <T variant="small" color={selected ? colors.light : colors.muted} style={{ fontSize: 14 }}>
        {label}
      </T>
    </Pressable>
  );
}

/** Star + number badge. */
export function RatingBadge({ rating, count }: { rating?: number; count?: number }) {
  if (rating == null) return null;
  return (
    <View style={styles.badge}>
      <Ionicons name="star" size={12} color={colors.star} />
      <T variant="small" color={colors.light}>
        {rating.toFixed(1)}
        {count != null ? ` (${count})` : ""}
      </T>
    </View>
  );
}

/** Round glass button for the corners of photos and maps (back, bookmark, search). */
export function RoundButton({
  icon,
  onPress,
  label,
  size = 42,
  active,
}: {
  icon: Icon;
  onPress?: () => void;
  label: string;
  size?: number;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.round, { width: size, height: size, borderRadius: size / 2 }, active && { backgroundColor: colors.light }]}
    >
      <Ionicons name={icon} size={size * 0.48} color={active ? colors.onLight : colors.light} />
    </Pressable>
  );
}

/** Pill tabs (Details | Map | Reviews | Photos). The active one is outlined in mint. */
export function PillTabs<T2 extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T2; label: string }[];
  active: T2;
  onChange: (key: T2) => void;
}) {
  return (
    <View style={styles.pills}>
      {tabs.map((t) => (
        <Pressable
          key={t.key}
          onPress={() => {
            tap();
            onChange(t.key);
          }}
          style={[styles.pill, active === t.key && styles.pillOn]}
        >
          <T variant="small" color={active === t.key ? colors.light : colors.muted} style={{ fontSize: 14 }}>
            {t.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}

/** "Top guides ........ See all" */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.section}>
      <T variant="h2">{title}</T>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <T variant="small" color={colors.accent} style={{ fontSize: 14 }}>
            {action}
          </T>
        </Pressable>
      )}
    </View>
  );
}

/** Small icon + value + label tile (Duration / Distance / Level). */
export function StatTile({ icon, value, label, sub }: { icon: Icon; value: string; label: string; sub?: string }) {
  return (
    <View style={styles.tile}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name={icon} size={14} color={colors.accent} />
        <T variant="small" color={colors.muted}>
          {label}
        </T>
      </View>
      <T variant="stat" style={{ marginTop: 6 }}>
        {value}
      </T>
      {sub ? (
        <T variant="small" color={colors.muted} style={{ marginTop: 2 }}>
          {sub}
        </T>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    marginRight: 8,
  },
  chipOn: { backgroundColor: "rgba(142,182,155,0.16)", borderColor: colors.accent },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: "rgba(5,31,32,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  round: { backgroundColor: "rgba(5,31,32,0.55)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(218,241,222,0.14)" },
  pills: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.surface2, backgroundColor: colors.surface },
  pillOn: { borderColor: colors.accent, backgroundColor: "rgba(142,182,155,0.16)" },
  section: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: 26 },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.surface2, padding: 14 },
});

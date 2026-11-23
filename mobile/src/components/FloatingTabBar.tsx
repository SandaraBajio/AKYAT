import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tap } from "../lib/haptics";
import { colors } from "../theme";
import { T } from "./T";

/** The slice of the tab bar props we use (the library's own type isn't importable without an extra dependency). */
interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  emitter: { emit(e: { type: "tabPress"; target: string; canPreventDefault: true }): { defaultPrevented?: boolean } };
  navigateToTab: (routeKey: string) => void;
}
type Icon = keyof typeof Ionicons.glyphMap;

const ITEMS: Record<string, { label: string; icon: Icon; active: Icon }> = {
  index: { label: "Home", icon: "home-outline", active: "home" },
  explore: { label: "Explore", icon: "compass-outline", active: "compass" },
  record: { label: "Record", icon: "play", active: "play" },
  community: { label: "Community", icon: "people-outline", active: "people" },
  profile: { label: "Profile", icon: "person-outline", active: "person" },
};

/** Floating pill tab bar (last reference image). The centre button starts a hike. */
export function FloatingTabBar({ state, emitter, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const item = ITEMS[route.name];
          if (!item) return null;
          const focused = state.index === index;
          const go = () => {
            tap();
            const e = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !e.defaultPrevented) navigateToTab(route.key);
          };

          if (route.name === "record") {
            return (
              <Pressable key={route.key} onPress={go} accessibilityRole="button" accessibilityLabel="Record a hike" style={styles.center}>
                <View style={[styles.recordBtn, focused && { backgroundColor: colors.accent }]}>
                  <Ionicons name="play" size={26} color={colors.onLight} style={{ marginLeft: 3 }} />
                </View>
              </Pressable>
            );
          }
          return (
            <Pressable key={route.key} onPress={go} accessibilityRole="button" accessibilityLabel={item.label} style={[styles.item, focused && styles.itemOn]}>
              <Ionicons name={focused ? item.active : item.icon} size={22} color={focused ? colors.light : colors.muted} />
              {focused && (
                <T variant="small" color={colors.light}>
                  {item.label}
                </T>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 14, right: 14 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(11,43,38,0.97)",
    borderRadius: 34,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 8,
    height: 68,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  item: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 50, borderRadius: 25 },
  itemOn: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.line },
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  recordBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.light, alignItems: "center", justifyContent: "center" },
});

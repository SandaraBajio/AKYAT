import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tap } from "../lib/haptics";
import { colors } from "../theme";

/** Read-only stars. Fractions round to the nearest whole star. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= Math.round(value) ? "star" : "star-outline"} size={size} color={colors.star} />
      ))}
    </View>
  );
}

/** Tap-to-rate stars (1-5). */
export function StarsInput({ value, onChange, size = 38 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          accessibilityRole="button"
          accessibilityLabel={`${n} star${n > 1 ? "s" : ""}`}
          hitSlop={4}
          onPress={() => {
            tap();
            onChange(n);
          }}
        >
          <Ionicons name={n <= value ? "star" : "star-outline"} size={size} color={n <= value ? colors.star : colors.line} />
        </Pressable>
      ))}
    </View>
  );
}

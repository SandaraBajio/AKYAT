import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { tap } from "../lib/haptics";
import { colors, radius } from "../theme";
import { T } from "./T";

type Icon = keyof typeof Ionicons.glyphMap;

interface Props {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: Icon;
  iconRight?: Icon;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

const BG = { primary: colors.light, secondary: colors.surface2, ghost: "transparent", danger: "rgba(229,96,77,0.14)" } as const;
const FG = { primary: colors.onLight, secondary: colors.light, ghost: colors.accent, danger: colors.danger } as const;

export function Button({ title, onPress, variant = "primary", icon, iconRight, loading, disabled, style }: Props) {
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        tap();
        onPress?.();
      }}
      disabled={off}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: BG[variant], opacity: off ? 0.5 : pressed ? 0.85 : 1 },
        variant === "secondary" && { borderWidth: 1, borderColor: colors.line },
        variant === "danger" && { borderWidth: 1, borderColor: "rgba(229,96,77,0.5)" },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant]} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={20} color={FG[variant]} />}
          <T variant="title" color={FG[variant]}>
            {title}
          </T>
          {iconRight && <Ionicons name={iconRight} size={20} color={FG[variant]} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: radius.button,
    minHeight: 54,
  },
});

import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius } from "../theme";

type Icon = keyof typeof Ionicons.glyphMap;

interface Props extends Pick<TextInputProps, "value" | "onChangeText" | "placeholder" | "secureTextEntry" | "keyboardType" | "autoCapitalize" | "multiline" | "maxLength" | "onSubmitEditing" | "returnKeyType" | "autoComplete" | "textContentType"> {
  icon?: Icon;
  /** Translucent "glass" look for inputs on top of the mountain backdrop. */
  glass?: boolean;
  style?: StyleProp<ViewStyle>;
  label?: string;
}

export function Input({ icon, glass, style, label, multiline, ...rest }: Props) {
  return (
    <View style={[styles.box, glass ? styles.glass : styles.solid, multiline && { alignItems: "flex-start" }, style]}>
      {icon && <Ionicons name={icon} size={18} color={colors.muted} style={multiline ? { marginTop: 14 } : undefined} />}
      <TextInput
        {...rest}
        multiline={multiline}
        accessibilityLabel={label ?? rest.placeholder}
        placeholderTextColor="rgba(218,241,222,0.45)"
        style={[styles.input, multiline && { minHeight: 90, textAlignVertical: "top", paddingTop: 14 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: radius.input, paddingHorizontal: 16, borderWidth: 1 },
  glass: { backgroundColor: "rgba(218,241,222,0.12)", borderColor: "rgba(218,241,222,0.18)" },
  solid: { backgroundColor: colors.surface, borderColor: colors.surface2 },
  input: { flex: 1, paddingVertical: 15, fontFamily: font.regular, fontSize: 15, color: colors.light },
});

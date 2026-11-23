import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { T } from "./T";

/** "───── or ─────" followed by Facebook / Google / Apple buttons (login and signup screens). */
export function SocialRow() {
  const [note, setNote] = useState<string | null>(null);
  const items: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { icon: "logo-facebook", label: "Facebook" },
    { icon: "logo-google", label: "Google" },
    { icon: "logo-apple", label: "Apple" },
  ];
  return (
    <View style={{ marginTop: 22 }}>
      <View style={styles.divider}>
        <View style={styles.line} />
        <T variant="small" color="rgba(218,241,222,0.8)">
          or
        </T>
        <View style={styles.line} />
      </View>
      <View style={styles.icons}>
        {items.map((i) => (
          <Pressable key={i.label} accessibilityRole="button" accessibilityLabel={`Continue with ${i.label}`} onPress={() => setNote(`${i.label} sign-in is coming soon.`)} hitSlop={8}>
            <Ionicons name={i.icon} size={30} color={colors.light} />
          </Pressable>
        ))}
      </View>
      {note && (
        <T variant="small" color={colors.muted} style={{ textAlign: "center", marginTop: 10 }}>
          {note}
        </T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: "rgba(218,241,222,0.35)" },
  icons: { flexDirection: "row", justifyContent: "center", gap: 34, marginTop: 18 },
});

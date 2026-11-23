import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../src/components/Button";
import { MountainBackdrop } from "../src/components/MountainBackdrop";
import { T } from "../src/components/T";
import { colors, font } from "../src/theme";

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <MountainBackdrop />
      <View style={[styles.top, { paddingTop: insets.top + 24 }]}>
        <T variant="small" color="rgba(255,255,255,0.8)">
          Welcome to
        </T>
        <T style={styles.logo}>AKYAT</T>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
        <T variant="h1" color={colors.white} style={{ fontSize: 32, lineHeight: 37 }}>
          Take a break from{"\n"}your busy life.
        </T>
        <T variant="body" color="rgba(218,241,222,0.85)" style={{ marginTop: 10, marginBottom: 26 }}>
          Guided hikes in Batangas, live trail tracking, and a community of hikers to share the climb with.
        </T>
        <Button title="Get started" iconRight="arrow-forward" onPress={() => router.push("/signup")} />
        <Button title="I already have an account" variant="ghost" onPress={() => router.push("/login")} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { paddingHorizontal: 28 },
  logo: { fontFamily: font.black, fontSize: 44, letterSpacing: 6, color: colors.white, marginTop: 2 },
  bottom: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 24 },
});

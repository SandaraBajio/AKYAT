import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { MountainBackdrop } from "../src/components/MountainBackdrop";
import { SocialRow } from "../src/components/SocialRow";
import { T } from "../src/components/T";
import { authService, isMockMode, ServiceError } from "../src/services";
import { colors } from "../src/theme";

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      await authService.signIn(email, password);
      // On success the auth listener switches the app to the signed-in screens.
    } catch (e) {
      setError(e instanceof ServiceError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <MountainBackdrop />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={26} color={colors.white} />
          </Pressable>

          <View style={{ marginTop: 48 }}>
            <T variant="display" color={colors.white} style={{ fontStyle: "italic" }}>
              Welcome{"\n"}BACK!
            </T>
            <T variant="body" color="rgba(255,255,255,0.8)" style={{ marginTop: 6 }}>
              Continue your adventure
            </T>
          </View>

          <View style={{ marginTop: 110, gap: 12 }}>
            <Input glass icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
            <Input glass icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" onSubmitEditing={submit} returnKeyType="go" />

            <View style={styles.rowBetween}>
              <Pressable style={styles.remember} onPress={() => setRemember((r) => !r)} accessibilityRole="checkbox" accessibilityState={{ checked: remember }}>
                <View style={[styles.box, remember && { backgroundColor: colors.light }]}>
                  {remember && <Ionicons name="checkmark" size={13} color={colors.onLight} />}
                </View>
                <T variant="small" color={colors.light}>
                  Remember me
                </T>
              </Pressable>
              {/* TODO (Data teammate): sendPasswordResetEmail(auth, email) from firebase/auth */}
              <Pressable onPress={() => setNote("Password reset is coming soon.")}>
                <T variant="small" color={colors.light}>
                  Forgot password?
                </T>
              </Pressable>
            </View>

            {error && (
              <T variant="small" color="#FFB4A8">
                {error}
              </T>
            )}
            {note && (
              <T variant="small" color={colors.muted}>
                {note}
              </T>
            )}
            <Button title="Log in" onPress={submit} loading={busy} style={{ marginTop: 6 }} />
          </View>

          <SocialRow />

          <View style={{ flex: 1 }} />
          <Pressable onPress={() => router.replace("/signup")} style={{ marginTop: 24 }}>
            <T variant="body" color={colors.light} style={{ textAlign: "center" }}>
              New here? <T variant="body" color={colors.white} style={{ textDecorationLine: "underline" }}>Create an account</T>
            </T>
          </Pressable>
          {isMockMode && (
            <T variant="small" color={colors.muted} style={{ textAlign: "center", marginTop: 10 }}>
              Mock mode: any email and password works.
            </T>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  remember: { flexDirection: "row", alignItems: "center", gap: 8 },
  box: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: colors.light, alignItems: "center", justifyContent: "center" },
});

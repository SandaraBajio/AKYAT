import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { MountainBackdrop } from "../src/components/MountainBackdrop";
import { SocialRow } from "../src/components/SocialRow";
import { T } from "../src/components/T";
import { authService, ServiceError } from "../src/services";
import { colors } from "../src/theme";

export default function Signup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    if (!first.trim() || !email.trim() || !password) return setError("Please fill in your name, email and password.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("The passwords don't match.");
    setBusy(true);
    try {
      await authService.signUp(email, password, `${first.trim()} ${last.trim()}`.trim());
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

          <T variant="display" color={colors.white} style={{ fontStyle: "italic", marginTop: 34, fontSize: 34, lineHeight: 38 }}>
            Create account
          </T>

          <View style={{ marginTop: 96, gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Input glass placeholder="First name" value={first} onChangeText={setFirst} style={{ flex: 1 }} autoComplete="given-name" />
              <Input glass placeholder="Last name" value={last} onChangeText={setLast} style={{ flex: 1 }} autoComplete="family-name" />
            </View>
            <Input glass icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" />
            <Input glass icon="lock-closed-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" />
            <Input glass icon="lock-closed-outline" placeholder="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry textContentType="newPassword" onSubmitEditing={submit} returnKeyType="go" />

            <T variant="small" color="rgba(218,241,222,0.8)" style={{ fontSize: 11.5 }}>
              By continuing, I agree to Akyat's Terms of Service and acknowledge the Privacy Policy.
            </T>
            {error && (
              <T variant="small" color="#FFB4A8">
                {error}
              </T>
            )}
            <Button title="Sign up" onPress={submit} loading={busy} style={{ marginTop: 4 }} />
          </View>

          <SocialRow />

          <View style={{ flex: 1 }} />
          <Pressable onPress={() => router.replace("/login")} style={{ marginTop: 24 }}>
            <T variant="body" color={colors.light} style={{ textAlign: "center" }}>
              Already have an account? <T variant="body" color={colors.white} style={{ textDecorationLine: "underline" }}>Log in</T>
            </T>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

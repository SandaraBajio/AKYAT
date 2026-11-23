import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/outfit";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { colors, font } from "../src/theme";

function Routes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  // Signed-out people only see welcome / login / signup; signed-in people only see the app.
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.light,
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: font.semi, fontSize: 17 },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Protected guard={!user}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="trail/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="booking/[trailId]" options={{ title: "Create Booking" }} />
        <Stack.Screen name="payment" options={{ title: "Select Payment" }} />
        <Stack.Screen name="booking-success" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="bookings" options={{ title: "My bookings" }} />
        <Stack.Screen name="saved" options={{ title: "Saved trails" }} />
        <Stack.Screen name="filters" options={{ presentation: "modal", title: "Filters" }} />
        <Stack.Screen name="hike/active" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="hike/summary" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="rate" options={{ presentation: "modal", title: "Rate your hike" }} />
        <Stack.Screen name="guide/[id]" options={{ title: "Guide" }} />
        <Stack.Screen name="post/new" options={{ presentation: "modal", title: "New post" }} />
        <Stack.Screen name="post/[id]" options={{ title: "Comments" }} />
        <Stack.Screen name="story/[id]" options={{ headerShown: false, presentation: "fullScreenModal", animation: "fade" }} />
        <Stack.Screen name="people" options={{ title: "Find hikers" }} />
        <Stack.Screen name="leaderboard" options={{ title: "Hike Progress" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold });

  // If a font fails to load we carry on with the system font rather than blocking the app.
  if (!loaded && !error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Routes />
    </AuthProvider>
  );
}

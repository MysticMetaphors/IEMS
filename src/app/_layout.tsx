import { AuthProvider, useAuth } from "@/lib/auth/auth-context";
import { queryClient } from "@/lib/query/client";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { OleoScriptSwashCaps_400Regular } from "@expo-google-fonts/oleo-script-swash-caps";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Screens outside both guards (index, db/*) are reachable either way. */
function RootNavigator() {
  const { state, loadError, refresh } = useAuth();

  if (loadError) {
    return (
      <View className="flex-1 items-center justify-center gap-[15px] bg-white p-[38px]">
        <Text className="text-[14px] text-text text-center">{loadError}</Text>
        <Pressable onPress={refresh} className="px-[18px] py-[16px] rounded-[12px] bg-foreground">
          <Text className="text-[14px] text-white font-semibold">Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!state) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "none", }}>
      <Stack.Protected guard={!state.user}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/forgot-password" />
      </Stack.Protected>

      <Stack.Protected guard={!!state.user}>
        <Stack.Screen name="(dashboard)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,

    OleoScriptSwashCaps: OleoScriptSwashCaps_400Regular,
    InstrumentSerif: InstrumentSerif_400Regular
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
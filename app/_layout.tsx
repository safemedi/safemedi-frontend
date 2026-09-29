import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { TamaguiProvider } from "tamagui";

import { sanitizeUrlForLog } from "@/api/client";
import { ProfileSync } from "@/components/ProfileSync";
import { PushNotificationSync } from "@/components/PushNotificationSync";
import { palette } from "@/constants/design-tokens";
import { tamaguiConfig } from "../tamagui.config";

const sentryEnvironment =
  process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? "development" : "production");

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: sentryEnvironment,
  // production은 트랜잭션 수집량을 낮춰 Sentry 쿼터를 아끼고, 그 외 환경은 테스트가 쉽도록 전량 수집한다.
  tracesSampleRate: sentryEnvironment === "production" ? 0.2 : 1.0,
  integrations: [Sentry.expoRouterIntegration()],
  enableAutoSessionTracking: true,
  // fetch/XHR breadcrumb는 SDK가 자동으로 원본 URL을 담아 생성하므로,
  // api/client.ts의 captureServerError와 동일한 기준으로 여기서도 redact한다.
  beforeBreadcrumb: (breadcrumb) => {
    const url = breadcrumb.data?.url;
    if (typeof url === "string") {
      breadcrumb.data = { ...breadcrumb.data, url: sanitizeUrlForLog(url) };
    }
    return breadcrumb;
  },
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

const navigationLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.tint,
    background: palette.background,
    card: palette.background,
    text: palette.text,
    border: palette.icon,
    notification: palette.tint,
  },
};

export const unstable_settings = {
  anchor: "index",
};

function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProfileSync />
      <PushNotificationSync />
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <ThemeProvider value={navigationLight}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(detail)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
        </ThemeProvider>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);

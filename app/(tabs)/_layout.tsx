import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Foundation from "@expo/vector-icons/Foundation";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router, Tabs } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScanIcon from "@/assets/images/scan_icon.png";
import { AuthGateView } from "@/components/AuthGateView";
import { palette } from "@/constants/design-tokens";
import { useAuthRouteState } from "@/hooks/useAuthRouteState";
import { useUserStore } from "@/stores/userStore";

const BG_PINK_LINE_STOPS = [0, 0.5, 1] as const;
const TAB_BAR_CONTENT_HEIGHT = 70;

export default function TabLayout() {
  const authState = useAuthRouteState();
  const user = useUserStore((s) => s.user);
  const insets = useSafeAreaInsets();

  if (authState.kind === "loading") {
    return <AuthGateView kind="loading" />;
  }

  if (authState.kind === "error") {
    return <AuthGateView kind="error" onRetry={authState.retry} onLogout={authState.logout} />;
  }

  if (authState.href !== "/(tabs)/dashboard") {
    return <Redirect href={authState.href} />;
  }

  if (!user) {
    return <AuthGateView kind="loading" />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...palette.bg_pink_line]}
        locations={[...BG_PINK_LINE_STOPS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: palette.green,
          tabBarInactiveTintColor: palette.icon,
          headerShown: false,
          sceneStyle: { backgroundColor: palette.transparent },
          tabBarLabelStyle: {
            fontSize: 14,
          },
          tabBarStyle: {
            height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
            paddingTop: 6,
            paddingBottom: insets.bottom,
            paddingHorizontal: 18,
          },
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "대시보드",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="manage"
          options={{
            title: "관리",
            tabBarIcon: ({ color }) => <Foundation name="graph-bar" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: "",
            tabBarIconStyle: {
              marginTop: -25,
              width: 56,
              height: 56,
            },
            tabBarIcon: () => <Image source={ScanIcon} style={{ width: 56, height: 56 }} />,
          }}
          listeners={{
            tabPress: (event) => {
              event.preventDefault();
              router.push("/(detail)/scan/scan");
            },
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: "주변 약국",
            tabBarIcon: ({ color }) => (
              <FontAwesome5 name="map-marker-alt" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "프로필",
            tabBarIcon: ({ color }) => <Ionicons name="person-sharp" size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

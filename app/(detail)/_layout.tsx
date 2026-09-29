import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

import { palette } from "@/constants/design-tokens";

const BG_PINK_LINE_STOPS = [0, 0.5, 1] as const;

export default function DetailLayout() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...palette.bg_pink_line]}
        locations={[...BG_PINK_LINE_STOPS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.transparent },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

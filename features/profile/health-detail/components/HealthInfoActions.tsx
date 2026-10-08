import Ionicons from "@expo/vector-icons/Ionicons";
import { useCallback } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { PillButton } from "@/components/ui/PillButton";
import { palette } from "@/constants/design-tokens";
import {
  PRINT_SUCCESS_MESSAGE,
  SHARE_SUCCESS_MESSAGE,
} from "@/features/profile/health-detail/constants";

export function HealthInfoActions() {
  const handlePrint = useCallback(() => {
    Alert.alert("인쇄하기", PRINT_SUCCESS_MESSAGE);
  }, []);

  const handleShare = useCallback(() => {
    Alert.alert("공유하기", SHARE_SUCCESS_MESSAGE);
  }, []);

  return (
    <View style={styles.actionRow}>
      <PillButton
        variant="outline"
        onPress={handlePrint}
        borderColor={palette.green_soft}
        backgroundColor="transparent"
        leftElement={<Ionicons name="print-outline" size={14} color={palette.green_deep} />}
        accessibilityLabel="건강 정보 인쇄하기"
      >
        <Text style={styles.outlineActionText}>인쇄하기</Text>
      </PillButton>
      <PillButton
        variant="solid"
        onPress={handleShare}
        backgroundColor={palette.green}
        leftElement={<Ionicons name="share-social-outline" size={14} color={palette.white} />}
        accessibilityLabel="건강 정보 공유하기"
      >
        <Text style={styles.solidActionText}>공유하기</Text>
      </PillButton>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  outlineActionText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: palette.green_deep,
  },
  solidActionText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: palette.white,
  },
});

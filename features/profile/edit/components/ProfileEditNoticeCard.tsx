import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { Text } from "tamagui";

import { palette } from "@/constants/design-tokens";

export function ProfileEditNoticeCard() {
  return (
    <LinearGradient
      colors={[palette.notice_bg_start, palette.notice_bg_end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.card}
    >
      <View style={styles.row}>
        <Text style={styles.emoji}>⚠️</Text>
        <View style={styles.textWrap}>
          <Text style={styles.title}>주의사항</Text>
          <Text style={styles.description}>
            정확한 알러지와 기저질환 정보는 안전한 약물 분석에 매우 중요합니다. 의사나 약사와 상담한
            내용을 정확히 입력해주세요.
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.notice_border,
    padding: 15,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  emoji: {
    fontSize: 21,
    lineHeight: 28,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: palette.notice_title,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    color: palette.notice_description,
  },
});

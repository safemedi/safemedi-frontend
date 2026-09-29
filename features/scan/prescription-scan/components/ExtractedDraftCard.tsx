import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "tamagui";
import { PillButton } from "@/components/ui/PillButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

interface ExtractedDraftCardProps {
  readonly draftJson: string;
  readonly isSubmitting: boolean;
  readonly onPressSubmit: () => void;
}

export function ExtractedDraftCard({
  draftJson,
  isSubmitting,
  onPressSubmit,
}: ExtractedDraftCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>추출된 JSON</Text>
        <Text style={styles.subtitle}>OCR 결과를 확인한 뒤 등록하세요.</Text>
      </View>
      <ScrollView style={styles.jsonBox} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        <Text style={styles.jsonText}>{draftJson}</Text>
      </ScrollView>
      <PillButton
        variant="solid"
        disabled={isSubmitting}
        onPress={onPressSubmit}
        accessibilityLabel="추출 결과로 처방전 등록"
        backgroundColor={palette.green}
      >
        <Text style={styles.submitText}>{isSubmitting ? "등록 중..." : "추출 결과로 등록"}</Text>
      </PillButton>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 12,
  },
  header: {
    gap: 2,
  },
  title: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
  },
  jsonBox: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: palette.border_muted,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: palette.surface_subtle,
  },
  jsonText: {
    color: palette.black,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "monospace",
  },
  submitText: {
    color: palette.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});

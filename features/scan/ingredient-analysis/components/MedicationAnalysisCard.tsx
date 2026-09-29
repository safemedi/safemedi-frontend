import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, View } from "react-native";
import { Text, YStack } from "tamagui";
import { GradientCard } from "@/components/ui/GradientCard";
import { palette } from "@/constants/design-tokens";
import { RISK_TONE_BY_LEVEL } from "../constants";
import type { MedicationAnalysisCardModel } from "../types";
import { MedicationWarningCard } from "./MedicationWarningCard";

interface MedicationAnalysisCardProps {
  readonly medication: MedicationAnalysisCardModel;
}

interface BulletTextGroupProps {
  readonly title: string;
  readonly items: readonly string[];
}

function BulletTextGroup({ title, items }: BulletTextGroupProps) {
  return (
    <YStack gap={6}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <YStack gap={2}>
        {items.map((item) => (
          <Text key={`${title}-${item}`} style={styles.sectionItem}>
            • {item}
          </Text>
        ))}
      </YStack>
    </YStack>
  );
}

export function MedicationAnalysisCard({ medication }: MedicationAnalysisCardProps) {
  const tone = RISK_TONE_BY_LEVEL[medication.riskLevel];

  return (
    <View style={styles.container}>
      <GradientCard gradientColors={[tone.startColor, tone.endColor]} style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="checkmark-circle-outline" size={18} color={palette.white} />
          <YStack gap={2}>
            <Text style={styles.riskLabel}>{tone.label}</Text>
            <Text style={styles.drugName}>{medication.drugName}</Text>
          </YStack>
        </View>
      </GradientCard>
      <YStack gap={10} style={styles.body}>
        {medication.warnings.map((warning) => (
          <MedicationWarningCard
            key={`${medication.atcCode}-${warning.type}-${warning.message}`}
            warning={warning}
          />
        ))}
        <BulletTextGroup title="💊 효능" items={medication.efficacy} />
        <BulletTextGroup title="⚠️ 주의사항" items={medication.precautions} />
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: palette.surface_card,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
  },
  header: {
    minHeight: 66,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  riskLabel: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.9,
  },
  drugName: {
    color: palette.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sectionTitle: {
    color: palette.black,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  sectionItem: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
  },
});

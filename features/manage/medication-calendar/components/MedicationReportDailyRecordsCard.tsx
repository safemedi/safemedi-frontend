import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { PillButton } from "@/components/ui/PillButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type { MedicationCalendarPrescriptionGroup } from "../useMedicationCalendarViewModel";

interface MedicationReportDailyRecordsCardProps {
  readonly title: string;
  readonly summary: string;
  readonly prescriptionGroups: readonly MedicationCalendarPrescriptionGroup[];
  readonly isLoading?: boolean;
  readonly isError?: boolean;
  readonly onRetry?: () => void;
}

function MedicationReportDailyRecordsSkeleton() {
  return (
    <YStack gap={14} accessibilityLabel="복약 기록 로딩 중">
      <View style={styles.skeletonGroupCard}>
        <View style={styles.skeletonGroupHeader} />
        <YStack gap={7} p={10}>
          <View style={styles.skeletonRecordRow} />
          <View style={styles.skeletonRecordRow} />
        </YStack>
      </View>
    </YStack>
  );
}

export function MedicationReportDailyRecordsCard({
  title,
  summary,
  prescriptionGroups,
  isLoading = false,
  isError = false,
  onRetry,
}: MedicationReportDailyRecordsCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <YStack gap={4} mb={14}>
        <XStack items="center" gap={8}>
          <Ionicons name="document-text-outline" size={18} color={palette.title_emphasis} />
          <Text style={styles.title}>{title}</Text>
        </XStack>
        {!isLoading ? (
          <Text style={styles.summary}>{summary}</Text>
        ) : (
          <View style={styles.skeletonSummary} />
        )}
      </YStack>

      {isLoading ? (
        <MedicationReportDailyRecordsSkeleton />
      ) : isError ? (
        <YStack style={styles.errorBox} gap={10}>
          <Text style={styles.errorText}>선택한 날짜의 복약 기록을 불러오지 못했습니다.</Text>
          {onRetry ? (
            <PillButton variant="outline" onPress={onRetry} flex={0}>
              <Text style={styles.retryText}>다시 시도</Text>
            </PillButton>
          ) : null}
        </YStack>
      ) : prescriptionGroups.length > 0 ? (
        <YStack gap={14}>
          {prescriptionGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <LinearGradient
                colors={[palette.blue, palette.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.groupHeader}
              >
                <Text style={styles.groupTitle}>📋 {group.prescriptionTitle}</Text>
              </LinearGradient>

              <YStack gap={7} p={10}>
                {group.items.map((item) => {
                  const isTaken = item.statusTone === "taken";
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.recordRow,
                        isTaken ? styles.recordRowTaken : styles.recordRowMissed,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusIcon,
                          isTaken ? styles.statusIconTaken : styles.statusIconMissed,
                        ]}
                      >
                        <Ionicons
                          name={isTaken ? "checkmark" : "close"}
                          size={16}
                          color={palette.white}
                        />
                      </View>

                      <YStack flex={1} gap={2}>
                        <Text
                          style={[
                            styles.medicationName,
                            isTaken ? styles.medicationNameTaken : styles.medicationNameMissed,
                          ]}
                        >
                          {item.medicationName}
                        </Text>
                        <XStack items="center" gap={4}>
                          <Ionicons name="time-outline" size={12} color={palette.icon} />
                          <Text style={styles.scheduledTime}>{item.scheduledTime}</Text>
                        </XStack>
                      </YStack>

                      <View
                        style={[
                          styles.statusBadge,
                          isTaken ? styles.statusBadgeTaken : styles.statusBadgeMissed,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>{item.statusLabel}</Text>
                      </View>
                    </View>
                  );
                })}
              </YStack>
            </View>
          ))}
        </YStack>
      ) : (
        <Text style={styles.emptyText}>선택한 날짜의 복약 기록이 없습니다.</Text>
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    backgroundColor: palette.overlay_white_90,
  },
  title: {
    color: palette.title_emphasis,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
  },
  summary: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  groupCard: {
    borderWidth: 1,
    borderColor: palette.dark_gray,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: palette.overlay_white_50,
  },
  groupHeader: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  groupTitle: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  recordRowTaken: {
    backgroundColor: palette.bg_achievement_card[0],
    borderColor: palette.light_green,
  },
  recordRowMissed: {
    backgroundColor: palette.warning_allergy_bg,
    borderColor: palette.red_soft,
  },
  recordRowUpcoming: {
    backgroundColor: palette.surface_neutral,
    borderColor: palette.dark_gray,
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconTaken: {
    backgroundColor: palette.green,
  },
  statusIconMissed: {
    backgroundColor: palette.red_medium,
  },
  statusIconUpcoming: {
    backgroundColor: palette.icon,
  },
  medicationName: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  medicationNameTaken: {
    color: palette.achievement_card_title,
  },
  medicationNameMissed: {
    color: palette.red_deep,
  },
  medicationNameUpcoming: {
    color: palette.title_emphasis,
  },
  scheduledTime: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeTaken: {
    backgroundColor: palette.green,
  },
  statusBadgeMissed: {
    backgroundColor: palette.red_medium,
  },
  statusBadgeUpcoming: {
    backgroundColor: palette.icon,
  },
  statusBadgeText: {
    color: palette.white,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  emptyText: {
    color: palette.icon,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "500",
  },
  skeletonSummary: {
    width: 120,
    height: 14,
    borderRadius: 7,
    backgroundColor: palette.surface_neutral,
  },
  skeletonGroupCard: {
    borderWidth: 1,
    borderColor: palette.dark_gray,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: palette.overlay_white_50,
  },
  skeletonGroupHeader: {
    height: 36,
    backgroundColor: palette.surface_neutral,
  },
  skeletonRecordRow: {
    height: 52,
    borderRadius: 14,
    backgroundColor: palette.surface_neutral,
  },
  errorBox: {
    alignItems: "center",
    paddingVertical: 12,
  },
  errorText: {
    color: palette.icon,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "500",
  },
  retryText: {
    color: palette.green_deep,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});

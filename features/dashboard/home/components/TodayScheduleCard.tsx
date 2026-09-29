import FontAwesome from "@expo/vector-icons/FontAwesome";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { Badge } from "@/components/ui/Badge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type {
  DashboardScheduleCardItem,
  DashboardSchedulePrescriptionItem,
} from "@/features/dashboard/home/useDashboardViewModel";

interface ToneStyle {
  readonly headerGradient: readonly [string, string];
  readonly contentGradient: readonly [string, string];
  readonly contentBorder: string;
  readonly badgeTextColor: string;
}

const TONE_STYLES: Record<DashboardScheduleCardItem["tone"], ToneStyle> = {
  success: {
    headerGradient: [palette.green, palette.opal],
    contentGradient: [palette.green, palette.opal],
    contentBorder: palette.light_green,
    badgeTextColor: palette.green_deep,
  },
  required: {
    headerGradient: [palette.blue, palette.purple],
    contentGradient: [palette.blue, palette.purple],
    contentBorder: palette.schedule_required_border,
    badgeTextColor: palette.blue_deep,
  },
  missed: {
    headerGradient: [palette.pending_status_bg, palette.pending_status_bg_end],
    contentGradient: [palette.pending_status_bg, palette.pending_status_bg_end],
    contentBorder: palette.notice_border,
    badgeTextColor: palette.notice_description,
  },
  upcoming: {
    headerGradient: [palette.schedule_upcoming_start, palette.schedule_upcoming_end],
    contentGradient: [palette.schedule_upcoming_start, palette.schedule_upcoming_end],
    contentBorder: palette.schedule_upcoming_border,
    badgeTextColor: palette.icon,
  },
};

interface TodayScheduleCardProps {
  readonly item: DashboardScheduleCardItem;
  readonly takingPrescriptionId: string | null;
  readonly onPressTake: (prescription: DashboardSchedulePrescriptionItem) => void;
}

export function TodayScheduleCard({
  item,
  takingPrescriptionId,
  onPressTake,
}: TodayScheduleCardProps) {
  const [expandedPrescriptionIds, setExpandedPrescriptionIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const toneStyle = TONE_STYLES[item.tone];

  const medicationRowsByPrescription = useMemo(() => {
    return new Map(
      item.prescriptions.map((prescription) => {
        const countMap = new Map<string, number>();
        const rows = prescription.medicationNames.map((name) => {
          const count = (countMap.get(name) ?? 0) + 1;
          countMap.set(name, count);
          return {
            key: `${prescription.id}-${name}-${count}`,
            name,
          };
        });
        return [prescription.id, rows] as const;
      }),
    );
  }, [item.prescriptions]);

  const handleToggleMedicationList = (prescriptionId: string) => {
    setExpandedPrescriptionIds((prev) => {
      const next = new Set(prev);
      if (next.has(prescriptionId)) {
        next.delete(prescriptionId);
      } else {
        next.add(prescriptionId);
      }
      return next;
    });
  };

  return (
    <SurfaceCard style={styles.card}>
      <LinearGradient
        colors={[...toneStyle.headerGradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <XStack items="center" justify="space-between">
          <XStack items="center" gap={10}>
            <View style={styles.iconCircle}>
              <Ionicons name="time-outline" size={16} color={palette.white} />
            </View>
            <YStack gap={2}>
              <Text style={styles.timeText}>{item.scheduledTime}</Text>
              <Text style={styles.countText}>{item.prescriptionCount}개 처방전</Text>
            </YStack>
          </XStack>
          <Badge
            label={item.statusLabel}
            backgroundColor={palette.overlay_white_90}
            textColor={toneStyle.badgeTextColor}
          />
        </XStack>
      </LinearGradient>

      <YStack gap={8} style={styles.prescriptionList}>
        {item.prescriptions.map((prescription) => {
          const isExpanded = expandedPrescriptionIds.has(prescription.id);
          const medicationRows = medicationRowsByPrescription.get(prescription.id) ?? [];
          const isTakeDisabled = takingPrescriptionId !== null;
          const prescriptionToneStyle = TONE_STYLES[prescription.tone];

          return (
            <View
              key={prescription.id}
              style={[styles.bottomWrap, { borderColor: prescriptionToneStyle.contentBorder }]}
            >
              <LinearGradient
                colors={[...prescriptionToneStyle.contentGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bottom}
              >
                <XStack items="center" justify="space-between">
                  <XStack items="center" gap={8} style={styles.prescriptionInfo}>
                    <View style={styles.bottomIconCircle}>
                      <Ionicons name="document-text-outline" size={12} color={palette.white} />
                    </View>
                    <YStack gap={2} style={styles.prescriptionTitleWrap}>
                      <Text style={styles.prescriptionTitle} numberOfLines={1} ellipsizeMode="tail">
                        📋 {prescription.prescriptionTitle}
                      </Text>
                      <Text style={styles.medicationCount}>
                        {prescription.medicationCount}개 약물
                      </Text>
                    </YStack>
                  </XStack>
                  <XStack items="center" gap={6} style={styles.prescriptionActions}>
                    {prescription.canMarkAsTaken ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`${prescription.prescriptionTitle} 복약 완료`}
                        disabled={isTakeDisabled}
                        style={[styles.takeButton, isTakeDisabled && styles.takeButtonDisabled]}
                        onPress={() => onPressTake(prescription)}
                      >
                        <FontAwesome name="check" size={18} color={palette.green_deep} />
                      </Pressable>
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${prescription.prescriptionTitle} 복약 상세 보기`}
                      style={styles.arrowButton}
                      onPress={() => handleToggleMedicationList(prescription.id)}
                    >
                      <Ionicons
                        name={isExpanded ? "chevron-down" : "chevron-forward"}
                        size={18}
                        color={palette.icon}
                      />
                    </Pressable>
                  </XStack>
                </XStack>
              </LinearGradient>

              {isExpanded ? (
                <View style={styles.medicationListContainer}>
                  {medicationRows.length > 0 ? (
                    medicationRows.map((medicationRow) => (
                      <XStack key={medicationRow.key} items="center" gap={6}>
                        <Text style={styles.medicationBullet}>•</Text>
                        <Text style={styles.medicationText}>{medicationRow.name}</Text>
                      </XStack>
                    ))
                  ) : (
                    <Text style={styles.medicationText}>약물 정보가 없습니다.</Text>
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
      </YStack>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.overlay_white_25,
  },
  timeText: {
    color: palette.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  countText: {
    color: palette.overlay_white_92,
    fontSize: 11,
    lineHeight: 14,
  },
  prescriptionList: {
    marginHorizontal: 10,
    marginVertical: 10,
  },
  bottomWrap: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  bottom: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  bottomIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.overlay_white_25,
  },
  prescriptionInfo: {
    flex: 1,
    flexShrink: 1,
  },
  prescriptionTitleWrap: {
    flexShrink: 1,
  },
  prescriptionActions: {
    flexShrink: 0,
  },
  prescriptionTitle: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  medicationCount: {
    color: palette.overlay_white_92,
    fontSize: 10,
    lineHeight: 14,
  },
  arrowButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: palette.overlay_white_90,
    alignItems: "center",
    justifyContent: "center",
  },
  takeButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: palette.transparent,
    alignItems: "center",
    justifyContent: "center",
  },
  takeButtonDisabled: {
    opacity: 0.5,
  },
  medicationListContainer: {
    borderTopWidth: 1,
    borderTopColor: palette.surface_card_border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    backgroundColor: palette.overlay_white_90,
  },
  medicationBullet: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 16,
  },
  medicationText: {
    flex: 1,
    color: palette.black,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
});

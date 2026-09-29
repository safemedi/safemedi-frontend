import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";
import { ListLinkRow } from "@/components/ui/ListLinkRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type { DashboardRecentPrescriptionItem } from "@/features/dashboard/home/useDashboardViewModel";

interface RecentPrescriptionsSectionProps {
  readonly items: readonly DashboardRecentPrescriptionItem[];
  readonly onPressItem: (item: DashboardRecentPrescriptionItem) => void;
}

export function RecentPrescriptionsSection({
  items,
  onPressItem,
}: RecentPrescriptionsSectionProps) {
  return (
    <YStack gap={10}>
      <SectionHeader
        icon={<Ionicons name="link-outline" size={16} color={palette.green} />}
        title="최근 처방전 기록"
      />

      {items.length > 0 ? (
        <YStack gap={8}>
          {items.map((item) => (
            <SurfaceCard key={item.id}>
              <ListLinkRow
                title={item.dateLabel}
                subtitle={`${item.analysisCount}개 약물 분석`}
                showChevron
                onPress={() => onPressItem(item)}
                trailing={
                  item.hasWarning ? <Text style={styles.warningBadge}>경고 있음</Text> : undefined
                }
                icon={<Ionicons name="scan-circle-outline" size={18} color={palette.blue} />}
                containerStyle={styles.row}
              />
            </SurfaceCard>
          ))}
        </YStack>
      ) : (
        <SurfaceCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>최근 처방전 기록이 없습니다.</Text>
        </SurfaceCard>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  warningBadge: {
    backgroundColor: palette.warning_badge_bg,
    color: palette.red_quick_text,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyCard: {
    paddingVertical: 36,
    paddingHorizontal: 14,
  },
  emptyText: {
    color: palette.icon,
    fontSize: 13,
    textAlign: "center",
  },
});

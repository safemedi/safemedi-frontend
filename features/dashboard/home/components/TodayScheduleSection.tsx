import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type {
  DashboardScheduleCardItem,
  DashboardSchedulePrescriptionItem,
} from "@/features/dashboard/home/useDashboardViewModel";
import { TodayScheduleCard } from "./TodayScheduleCard";

interface TodayScheduleSectionProps {
  readonly remainingCount: number;
  readonly items: readonly DashboardScheduleCardItem[];
  readonly takingPrescriptionId: string | null;
  readonly onPressTake: (prescription: DashboardSchedulePrescriptionItem) => void;
}

export function TodayScheduleSection({
  remainingCount,
  items,
  takingPrescriptionId,
  onPressTake,
}: TodayScheduleSectionProps) {
  return (
    <YStack gap={10}>
      <SectionHeader
        icon={<Ionicons name="time-outline" size={16} color={palette.green} />}
        title="오늘의 복약 스케줄"
        action={
          <Badge
            label={`${remainingCount}개 남음`}
            backgroundColor={palette.light_green}
            textColor={palette.green_deep}
          />
        }
      />

      {items.length > 0 ? (
        <YStack gap={10}>
          {items.map((item) => (
            <TodayScheduleCard
              key={item.id}
              item={item}
              takingPrescriptionId={takingPrescriptionId}
              onPressTake={onPressTake}
            />
          ))}
        </YStack>
      ) : (
        <SurfaceCard style={styles.emptyCard}>
          <Text style={styles.emptyText}>오늘 예정된 복약 스케줄이 없습니다.</Text>
        </SurfaceCard>
      )}
    </YStack>
  );
}

const styles = StyleSheet.create({
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

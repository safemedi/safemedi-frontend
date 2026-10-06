import { StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import type {
  TodayMedicationScheduleItem,
  TodayMedicationScheduleStatus,
} from "@/api/types/dashboard";
import { Badge } from "@/components/ui/Badge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

const STATUS_LABELS: Record<TodayMedicationScheduleStatus, string> = {
  SUCCESS: "복용 완료",
  NEED_TAKE: "복용 필요",
  WAITING: "대기",
  MISSED: "미복용",
  SKIP: "건너뜀",
};

interface FamilyTodayScheduleCardProps {
  readonly schedule: TodayMedicationScheduleItem;
}

export function FamilyTodayScheduleCard({ schedule }: FamilyTodayScheduleCardProps) {
  const status = schedule.displayStatus ?? schedule.status;
  return (
    <SurfaceCard style={styles.card}>
      <YStack gap={8}>
        <XStack items="center" justify="space-between">
          <Text color={palette.black} fontWeight="700">
            {schedule.takeTime}
          </Text>
          <Badge
            label={status ? STATUS_LABELS[status] : "상태 확인 중"}
            backgroundColor={palette.light_green}
            textColor={palette.green_deep}
          />
        </XStack>
        <Text color={palette.text}>{schedule.prescriptionTitle}</Text>
        <Text color={palette.icon} fontSize={12}>
          {schedule.drugCount}개 약물
        </Text>
        {schedule.drugNames?.length ? (
          <Text color={palette.icon} fontSize={12}>
            {schedule.drugNames.join(", ")}
          </Text>
        ) : null}
      </YStack>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({ card: { padding: 16 } });

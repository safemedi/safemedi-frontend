import { View } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { palette } from "@/constants/design-tokens";

const DEFAULT_INACTIVE = palette.dark_gray;
const DEFAULT_LABEL = palette.schedule_upcoming_start;

export type SegmentedStepProgressProps = {
  currentIndex: number;
  totalSteps: number;
  activeColor?: string;
  inactiveColor?: string;
  labelColor?: string;
  segmentHeight?: number;
  segmentGap?: number;
  showLabel?: boolean;
  labelMarginTop?: number;
  px?: number;
};

export function SegmentedStepProgress({
  currentIndex,
  totalSteps,
  activeColor = palette.green,
  inactiveColor = DEFAULT_INACTIVE,
  labelColor = DEFAULT_LABEL,
  segmentHeight = 5,
  segmentGap = 6,
  showLabel = true,
  labelMarginTop = 10,
  px,
}: SegmentedStepProgressProps) {
  if (totalSteps < 1) {
    return null;
  }

  const filledIndex = Math.max(0, Math.min(currentIndex, totalSteps - 1));
  const labelCurrent = filledIndex + 1;

  const segments = Array.from({ length: totalSteps }, (_, i) => {
    const segmentKey = `segment-${totalSteps}-${i}`;
    return (
      <View
        key={segmentKey}
        style={{
          flex: 1,
          height: segmentHeight,
          borderRadius: 999,
          backgroundColor: i <= filledIndex ? activeColor : inactiveColor,
        }}
      />
    );
  });

  return (
    <YStack width="100%" {...(px != null ? { px } : {})}>
      <XStack gap={segmentGap} width="100%">
        {segments}
      </XStack>
      {showLabel ? (
        <XStack justify="flex-end" mt={labelMarginTop} width="100%">
          <Text fontSize={13} fontWeight="500" style={{ color: labelColor }}>
            {labelCurrent} / {totalSteps}
          </Text>
        </XStack>
      ) : null}
    </YStack>
  );
}

import { Button, Text } from "tamagui";
import { palette } from "@/constants/design-tokens";

type SelectChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  flex?: number;
  height?: number;
  px?: number;
  selectedBackground?: string;
  unselectedBackground?: string;
  selectedBorderColor?: string;
  unselectedBorderColor?: string;
  borderWidth?: number;
  selectedTextColor?: string;
  unselectedTextColor?: string;
  textFontSize?: number;
  textFontWeight?: "400" | "500" | "600" | "700";
};

export function SelectChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
  flex,
  height = 38,
  px = 16,
  selectedBackground = palette.green,
  unselectedBackground = palette.overlay_white_90,
  selectedBorderColor = palette.green,
  unselectedBorderColor = palette.dark_gray,
  borderWidth = 1,
  selectedTextColor = palette.white,
  unselectedTextColor = palette.black,
  textFontSize = 14,
  textFontWeight = "600",
}: SelectChipProps) {
  return (
    <Button
      unstyled
      onPress={onPress}
      borderWidth={borderWidth}
      height={height}
      px={px}
      py={0}
      items="center"
      justify="center"
      pressStyle={{ opacity: 0.85 }}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        borderRadius: 999,
        flex,
        backgroundColor: selected ? selectedBackground : unselectedBackground,
        borderColor: selected ? selectedBorderColor : unselectedBorderColor,
        overflow: "hidden",
      }}
    >
      <Text
        fontSize={textFontSize}
        fontWeight={textFontWeight}
        style={{ color: selected ? selectedTextColor : unselectedTextColor }}
      >
        {label}
      </Text>
    </Button>
  );
}

import { Switch } from "tamagui";

import { palette } from "@/constants/design-tokens";

export type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function ToggleSwitch({
  value,
  onValueChange,
  disabled,
  accessibilityLabel,
}: ToggleSwitchProps) {
  return (
    <Switch
      checked={value}
      onCheckedChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      size="$2"
      backgroundColor={palette.dark_gray}
      activeStyle={{
        backgroundColor: palette.blue,
      }}
      opacity={disabled ? 0.5 : 1}
    >
      <Switch.Thumb transition="bouncy" backgroundColor={palette.white} />
    </Switch>
  );
}

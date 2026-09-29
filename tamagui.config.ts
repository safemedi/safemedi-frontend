import { defaultConfig } from "@tamagui/config/v5";
import { animationsReanimated } from "@tamagui/config/v5-reanimated";
import { createTamagui } from "tamagui";
import { palette } from "./constants/design-tokens";

function semanticTheme() {
  const p = palette;
  return {
    background: p.background,
    backgroundHover: p.background,
    backgroundPress: p.background,
    backgroundFocus: p.background,
    backgroundGreen: p.green,
    color: p.text,
    color12: p.text,
    accentBackground: p.tint,
    accentColor: p.tint,
    borderColor: p.icon,
    borderColorHover: p.icon,
    placeholderColor: p.icon,
  };
}

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  animations: animationsReanimated,
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      ...semanticTheme(),
    },
    dark: {
      ...defaultConfig.themes.dark,
      ...semanticTheme(),
    },
  },
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}

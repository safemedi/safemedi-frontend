import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type {
  MedicationCalendarDay,
  MedicationCalendarDayTone,
} from "../useMedicationCalendarViewModel";
import { getMedicationCalendarWeekdayLabels } from "../useMedicationCalendarViewModel";

interface MedicationReportCalendarCardProps {
  readonly monthLabel: string;
  readonly weeks: readonly (readonly MedicationCalendarDay[])[];
  readonly selectedDate: string | null;
  readonly onSelectDate: (date: string) => void;
  readonly onPreviousMonth: () => void;
  readonly onNextMonth: () => void;
  readonly canGoToNextMonth: boolean;
  readonly isLoading?: boolean;
}

interface DayCellStyle {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly textColor: string;
}

const EMPTY_DAY_STYLE: DayCellStyle = {
  backgroundColor: palette.white,
  borderColor: palette.dark_gray,
  textColor: palette.input_placeholder,
};

const DAY_TONE_STYLES: Record<
  Exclude<MedicationCalendarDayTone, "empty" | "future">,
  DayCellStyle
> = {
  green: {
    backgroundColor: palette.risk_safe_badge_bg,
    borderColor: palette.green_soft,
    textColor: palette.risk_safe_badge_text,
  },
  yellow: {
    backgroundColor: palette.risk_caution_badge_bg,
    borderColor: palette.warning_interaction_border_strong,
    textColor: palette.warning_interaction_message,
  },
  red: {
    backgroundColor: palette.risk_danger_badge_bg,
    borderColor: palette.red_soft,
    textColor: palette.red_medium,
  },
};

const LEGEND_ITEMS = [
  { label: "90% 이상", color: palette.green },
  { label: "70-89%", color: palette.risk_caution_start },
  { label: "70% 미만", color: palette.red_medium },
] as const;

function resolveDayCellStyle(tone: MedicationCalendarDayTone): DayCellStyle | null {
  if (tone === "future") return null;
  if (tone === "empty") return EMPTY_DAY_STYLE;
  return DAY_TONE_STYLES[tone];
}

const CALENDAR_SKELETON_WEEKS = ["w1", "w2", "w3", "w4", "w5"] as const;
const CALENDAR_SKELETON_DAYS = ["d1", "d2", "d3", "d4", "d5", "d6", "d7"] as const;

function MedicationReportCalendarSkeleton() {
  const weekdayLabels = getMedicationCalendarWeekdayLabels();

  return (
    <YStack gap={8} accessibilityLabel="달력 로딩 중">
      <XStack mb={8}>
        {weekdayLabels.map((label) => (
          <View key={label} style={styles.weekdayCell}>
            <Text style={styles.weekdayLabel}>{label}</Text>
          </View>
        ))}
      </XStack>

      {CALENDAR_SKELETON_WEEKS.map((weekId) => (
        <XStack key={weekId} items="stretch">
          {CALENDAR_SKELETON_DAYS.map((dayId) => (
            <View key={`${weekId}-${dayId}`} style={[styles.dayCellSlot, styles.skeletonDayCell]} />
          ))}
        </XStack>
      ))}
    </YStack>
  );
}

export function MedicationReportCalendarCard({
  monthLabel,
  weeks,
  selectedDate,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  canGoToNextMonth,
  isLoading = false,
}: MedicationReportCalendarCardProps) {
  const weekdayLabels = getMedicationCalendarWeekdayLabels();

  return (
    <SurfaceCard style={styles.card}>
      <XStack items="center" justify="space-between" mb={14}>
        <XStack items="center" gap={8} flex={1}>
          <Ionicons name="calendar-outline" size={18} color={palette.title_emphasis} />
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </XStack>

        <XStack items="center" gap={4}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="이전 달"
            onPress={onPreviousMonth}
            style={styles.monthNavButton}
          >
            <Ionicons name="chevron-back" size={18} color={palette.title_emphasis} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="다음 달"
            disabled={!canGoToNextMonth}
            onPress={onNextMonth}
            style={[
              styles.monthNavButton,
              !canGoToNextMonth ? styles.monthNavButtonDisabled : null,
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={canGoToNextMonth ? palette.title_emphasis : palette.input_placeholder}
            />
          </Pressable>
        </XStack>
      </XStack>

      {isLoading ? (
        <MedicationReportCalendarSkeleton />
      ) : (
        <>
          <XStack mb={8}>
            {weekdayLabels.map((label) => (
              <View key={label} style={styles.weekdayCell}>
                <Text style={styles.weekdayLabel}>{label}</Text>
              </View>
            ))}
          </XStack>

          <YStack gap={8}>
            {weeks.map((week) => (
              <XStack key={week.map((day) => day.id).join("-")} items="stretch">
                {week.map((day) => {
                  if (day.day === null || day.date === null) {
                    return <View key={day.id} style={styles.dayCellSlot} />;
                  }

                  const toneStyle = resolveDayCellStyle(day.tone);
                  const isSelected = day.date === selectedDate;
                  const isSelectable = day.tone !== "future";

                  if (!toneStyle) {
                    return (
                      <View key={day.id} style={styles.dayCellSlot}>
                        <Text style={styles.futureDayText}>{day.day}</Text>
                      </View>
                    );
                  }

                  return (
                    <Pressable
                      key={day.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      disabled={!isSelectable}
                      onPress={() => {
                        if (day.date) onSelectDate(day.date);
                      }}
                      style={[
                        styles.dayCell,
                        {
                          backgroundColor: toneStyle.backgroundColor,
                          borderColor: toneStyle.borderColor,
                        },
                        isSelected ? styles.selectedDayCell : null,
                      ]}
                    >
                      <Text style={[styles.dayNumber, { color: toneStyle.textColor }]}>
                        {day.day}
                      </Text>
                      {day.fraction ? (
                        <Text style={[styles.dayFraction, { color: toneStyle.textColor }]}>
                          {day.fraction}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </XStack>
            ))}
          </YStack>
        </>
      )}

      <View style={styles.legendDivider} />
      <XStack justify="center" gap={14} pt={14}>
        {LEGEND_ITEMS.map((item) => (
          <XStack key={item.label} items="center" gap={5}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
          </XStack>
        ))}
      </XStack>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
  },
  monthLabel: {
    color: palette.title_emphasis,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  monthNavButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surface_neutral,
  },
  monthNavButtonDisabled: {
    opacity: 0.5,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 28,
  },
  weekdayLabel: {
    color: palette.text_muted,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
  dayCellSlot: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: "14.28%",
    marginHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonDayCell: {
    borderRadius: 14,
    backgroundColor: palette.surface_neutral,
  },
  futureDayText: {
    color: palette.input_placeholder,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    fontWeight: "400",
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: "14.28%",
    marginHorizontal: 2,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDayCell: {
    shadowColor: palette.red_medium,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  dayNumber: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  dayFraction: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "400",
  },
  legendDivider: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: palette.dark_gray,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 4,
  },
  legendLabel: {
    color: palette.icon,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "400",
  },
});

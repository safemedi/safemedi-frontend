import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useCallback, useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { Text } from "tamagui";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

type PrescriptionDateField = "startDate" | "endDate";

export interface PrescriptionPeriodCardProps {
  readonly startDateLabel: string;
  readonly endDateLabel: string;
  readonly startDateValue: Date;
  readonly endDateValue: Date;
  readonly onSelectDate: (field: PrescriptionDateField, date: Date) => void;
}

export function PrescriptionPeriodCard({
  startDateLabel,
  endDateLabel,
  startDateValue,
  endDateValue,
  onSelectDate,
}: PrescriptionPeriodCardProps) {
  const [activeDateField, setActiveDateField] = useState<PrescriptionDateField | null>(null);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  const handlePressDateField = useCallback(
    (field: PrescriptionDateField) => {
      const currentDate = field === "startDate" ? startDateValue : endDateValue;
      if (Platform.OS === "android") {
        DateTimePickerAndroid.open({
          value: currentDate,
          mode: "date",
          onChange: (event, selectedDate) => {
            if (event.type !== "set" || !selectedDate) return;
            onSelectDate(field, selectedDate);
          },
        });
        return;
      }
      setPendingDate(currentDate);
      setActiveDateField(field);
    },
    [endDateValue, onSelectDate, startDateValue],
  );

  const handleCloseDatePicker = useCallback(() => {
    setActiveDateField(null);
    setPendingDate(null);
  }, []);

  const handleConfirmDatePicker = useCallback(() => {
    if (!activeDateField || !pendingDate) {
      handleCloseDatePicker();
      return;
    }
    onSelectDate(activeDateField, pendingDate);
    handleCloseDatePicker();
  }, [activeDateField, handleCloseDatePicker, onSelectDate, pendingDate]);

  const handleChangeDate = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (event.type === "dismissed") {
        handleCloseDatePicker();
        return;
      }
      if (!selectedDate) return;
      setPendingDate(selectedDate);
    },
    [handleCloseDatePicker],
  );

  return (
    <SurfaceCard style={styles.dateCard}>
      <Text style={styles.cardTitle}>복약 기간</Text>
      <View style={styles.dateFieldRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="복약 시작일 선택"
          onPress={() => handlePressDateField("startDate")}
          style={({ pressed }) => [styles.dateFieldPressable, pressed ? styles.pressed : null]}
        >
          <Text style={styles.dateFieldLabel}>시작일</Text>
          <Text style={styles.dateFieldValue}>{startDateLabel}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="복약 종료일 선택"
          onPress={() => handlePressDateField("endDate")}
          style={({ pressed }) => [styles.dateFieldPressable, pressed ? styles.pressed : null]}
        >
          <Text style={styles.dateFieldLabel}>종료일</Text>
          <Text style={styles.dateFieldValue}>{endDateLabel}</Text>
        </Pressable>
      </View>
      {Platform.OS === "ios" && activeDateField ? (
        <View style={styles.datePickerContainer}>
          <DateTimePicker
            value={pendingDate ?? new Date()}
            mode="date"
            display="spinner"
            onChange={handleChangeDate}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="날짜 선택 완료"
            onPress={handleConfirmDatePicker}
            style={({ pressed }) => [
              styles.datePickerConfirmButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.datePickerConfirmText}>완료</Text>
          </Pressable>
        </View>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  dateCard: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    gap: 10,
  },
  cardTitle: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  dateFieldRow: {
    flexDirection: "row",
    gap: 8,
  },
  dateFieldPressable: {
    flex: 1,
    backgroundColor: palette.gray,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 2,
  },
  dateFieldLabel: {
    color: palette.input_placeholder,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },
  dateFieldValue: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  datePickerContainer: {
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    borderRadius: 12,
    paddingVertical: 6,
    backgroundColor: palette.white,
  },
  datePickerConfirmButton: {
    alignSelf: "flex-end",
    marginRight: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: palette.green,
  },
  datePickerConfirmText: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
});

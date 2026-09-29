import { useState } from "react";
import { type Control, Controller } from "react-hook-form";
import { StyleSheet, TextInput } from "react-native";
import { Text, YStack } from "tamagui";
import type { DrugSearchItem } from "@/api/types";
import { DrugSearchResultList } from "@/components/ui/DrugSearchResultList";
import { palette } from "@/constants/design-tokens";
import { useDrugSearch } from "@/hooks/useDrugSearch";
import type { PrescriptionScanResultFormValues } from "../usePrescriptionScanResultViewModel";

interface MedicationDrugSearchFieldProps {
  readonly index: number;
  readonly control: Control<PrescriptionScanResultFormValues>;
  readonly onChangeMedicationName: (index: number, drugName: string) => void;
  readonly onSelectMedicationDrug: (index: number, item: DrugSearchItem) => void;
}

function formatDrugMeta(item: DrugSearchItem): string {
  return item.company ? `${item.company} · ${item.atcCode}` : item.atcCode;
}

export function MedicationDrugSearchField({
  index,
  control,
  onChangeMedicationName,
  onSelectMedicationDrug,
}: MedicationDrugSearchFieldProps) {
  const [keyword, setKeyword] = useState<string>("");
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const { items, isFetching, isFetchingNextPage, isSearchEnabled, loadMore } = useDrugSearch({
    keyword,
  });
  const shouldShowSuggestions = isInputFocused && keyword.trim().length > 0 && isSearchEnabled;

  const handleSelectSuggestion = (item: DrugSearchItem) => {
    setKeyword(item.drugName);
    onSelectMedicationDrug(index, item);
    setIsInputFocused(false);
  };

  return (
    <YStack gap={8}>
      <Text style={styles.label}>약물이름</Text>
      <Controller
        control={control}
        name={`medications.${index}.drugName`}
        render={({ field: { value } }) => (
          <TextInput
            value={value}
            onChangeText={(nextValue) => {
              setKeyword(nextValue);
              setIsInputFocused(true);
              onChangeMedicationName(index, nextValue);
            }}
            onFocus={() => {
              setKeyword(value);
              setIsInputFocused(true);
            }}
            onBlur={() => {
              setIsInputFocused(false);
            }}
            placeholder="약물명을 한글로 입력 후 목록에서 선택"
            placeholderTextColor={palette.input_placeholder}
            style={styles.input}
          />
        )}
      />
      <Controller
        control={control}
        name={`medications.${index}.atcCode`}
        render={({ field: { value } }) => (
          <Text style={[styles.metaText, value ? styles.verifiedText : styles.unverifiedText]}>
            {value ? `약물 코드: ${value}` : "검색 결과에서 약물을 선택해야 등록됩니다."}
          </Text>
        )}
      />
      {shouldShowSuggestions ? (
        <DrugSearchResultList<DrugSearchItem>
          items={items}
          keyExtractor={(item) => `${item.drugCode}-${item.atcCode}-${item.drugName}`}
          getTitle={(item) => item.drugName}
          getMeta={formatDrugMeta}
          onSelect={handleSelectSuggestion}
          onEndReached={loadMore}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          selectTrigger="pressIn"
          itemHeight={52}
        />
      ) : null}
    </YStack>
  );
}

const styles = StyleSheet.create({
  label: {
    color: palette.black,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  input: {
    backgroundColor: palette.gray,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    lineHeight: 20,
    color: palette.black,
  },
  metaText: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 16,
  },
  verifiedText: {
    color: palette.green,
  },
  unverifiedText: {
    color: palette.red_medium,
  },
});

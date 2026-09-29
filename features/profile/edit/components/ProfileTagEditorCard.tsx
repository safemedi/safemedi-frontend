import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text } from "tamagui";

import { Badge } from "@/components/ui/Badge";
import { DrugSearchResultList } from "@/components/ui/DrugSearchResultList";
import { SelectChip } from "@/components/ui/SelectChip";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { representativeFoodAllergyOptions } from "@/constants/health-profile-options";

import {
  PROFILE_EDIT_QUICK_ITEMS,
  PROFILE_EDIT_SECTION_STYLES,
  type ProfileEditSectionVariant,
} from "../constants";

export type ProfileTagSearchResult = {
  readonly id: string;
  readonly label: string;
  readonly meta?: string;
  readonly type: "ATC_GROUP" | "INGREDIENT" | "FOOD" | "DISEASE";
  readonly value: string;
  readonly name: string;
};

export interface ProfileTagEditorCardProps {
  readonly variant: ProfileEditSectionVariant;
  readonly title: string;
  readonly items: readonly string[];
  readonly inputValue: string;
  readonly inputPlaceholder: string;
  readonly onInputChange: (value: string) => void;
  readonly onAddItem: (value: string) => void;
  readonly onRemoveItem: (value: string) => void;
  readonly inputMode?: "custom" | "search" | "hidden";
  readonly searchResults?: readonly ProfileTagSearchResult[];
  readonly isSearchEnabled?: boolean;
  readonly isSearchFetching?: boolean;
  readonly isSearchFetchingNextPage?: boolean;
  readonly hasMoreSearchResults?: boolean;
  readonly onSelectSearchResult?: (value: ProfileTagSearchResult) => void;
  readonly onLoadMoreSearchResults?: () => void;
}

export function ProfileTagEditorCard({
  variant,
  title,
  items,
  inputValue,
  inputPlaceholder,
  onInputChange,
  onAddItem,
  onRemoveItem,
  inputMode = "custom",
  searchResults = [],
  isSearchEnabled = false,
  isSearchFetching = false,
  isSearchFetchingNextPage = false,
  hasMoreSearchResults = false,
  onSelectSearchResult,
  onLoadMoreSearchResults,
}: ProfileTagEditorCardProps) {
  const style = PROFILE_EDIT_SECTION_STYLES[variant];
  const quickItems = PROFILE_EDIT_QUICK_ITEMS[variant];
  const foodAllergyLabels = new Set<string>(
    representativeFoodAllergyOptions.map((option) => option.label),
  );
  const quickItemGroups =
    variant === "allergy"
      ? [
          {
            key: "medicine-allergy",
            items: quickItems.filter((item) => !foodAllergyLabels.has(item)),
          },
          { key: "food-allergy", items: quickItems.filter((item) => foodAllergyLabels.has(item)) },
        ].filter((group) => group.items.length > 0)
      : [{ key: variant, items: quickItems }];
  const isSearchMode = inputMode === "search";
  const shouldShowInput = inputMode !== "hidden";
  const shouldShowSearchResults = isSearchMode && inputValue.trim().length > 0 && isSearchEnabled;

  const handleEndReached = () => {
    if (hasMoreSearchResults && !isSearchFetchingNextPage) {
      onLoadMoreSearchResults?.();
    }
  };

  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.tagsWrap}>
        {items.map((item) => (
          <Badge
            key={item}
            label={item}
            backgroundColor={style.tagBackground}
            textColor={palette.white}
            style={styles.tag}
            textStyle={styles.tagText}
            rightElement={
              <Pressable hitSlop={8} onPress={() => onRemoveItem(item)}>
                <Ionicons name="close" size={12} color={palette.white} />
              </Pressable>
            }
          />
        ))}
      </View>

      {shouldShowInput ? (
        <>
          <View style={styles.inputRow}>
            <TextInput
              value={inputValue}
              onChangeText={onInputChange}
              placeholder={inputPlaceholder}
              placeholderTextColor={palette.input_placeholder}
              style={styles.input}
              returnKeyType={isSearchMode ? "search" : "done"}
              onSubmitEditing={() => {
                if (!isSearchMode) {
                  onAddItem(inputValue);
                }
              }}
            />
            {isSearchMode ? null : (
              <Pressable onPress={() => onAddItem(inputValue)} hitSlop={6}>
                <LinearGradient
                  colors={[...style.addButtonGradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addButton}
                >
                  <Ionicons name="add" size={14} color={palette.white} />
                </LinearGradient>
              </Pressable>
            )}
          </View>

          {shouldShowSearchResults && onSelectSearchResult ? (
            <DrugSearchResultList<ProfileTagSearchResult>
              items={searchResults}
              keyExtractor={(item) => item.id}
              getTitle={(item) => item.label}
              getMeta={(item) => item.meta}
              onSelect={onSelectSearchResult}
              onEndReached={handleEndReached}
              isFetching={isSearchFetching}
              isFetchingNextPage={isSearchFetchingNextPage}
            />
          ) : null}
        </>
      ) : null}

      <View style={styles.quickWrap}>
        <Text style={styles.quickLabel}>빠른 추가:</Text>
        <View style={styles.quickGroups}>
          {quickItemGroups.map((group) => (
            <View key={group.key} style={styles.quickItems}>
              {group.items.map((item) => (
                <SelectChip
                  key={item}
                  label={`+ ${item}`}
                  selected={false}
                  onPress={() => onAddItem(item)}
                  height={27}
                  px={10}
                  borderWidth={1}
                  unselectedBackground={style.quickTagBackground}
                  unselectedBorderColor={style.quickTagBorder}
                  unselectedTextColor={style.quickTagText}
                  textFontSize={11}
                  textFontWeight="400"
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 14,
  },
  title: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: palette.black,
    letterSpacing: -0.15,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    height: 30,
    paddingHorizontal: 10,
  },
  tagText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: palette.white,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: palette.gray,
    paddingHorizontal: 10,
    fontSize: 14,
    color: palette.black,
  },
  addButton: {
    width: 35,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickWrap: {
    gap: 6,
  },
  quickLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: palette.icon,
  },
  quickGroups: {
    gap: 6,
  },
  quickItems: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
});

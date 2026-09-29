import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette } from "@/constants/design-tokens";
import { isCloseToScrollEnd } from "@/utils/scroll";

const DEFAULT_MAX_VISIBLE_ITEMS = 5;
const DEFAULT_ITEM_HEIGHT = 54;

export interface DrugSearchResultListProps<TItem> {
  readonly items: readonly TItem[];
  readonly keyExtractor: (item: TItem) => string;
  readonly getTitle: (item: TItem) => string;
  readonly getMeta?: (item: TItem) => string | undefined;
  readonly onSelect: (item: TItem) => void;
  readonly onEndReached: () => void;
  readonly isFetching?: boolean;
  readonly isFetchingNextPage?: boolean;
  /** blur 전에 선택을 처리해야 하는 입력에서는 "pressIn" 을 사용한다. */
  readonly selectTrigger?: "press" | "pressIn";
  readonly emptyText?: string;
  readonly fetchingText?: string;
  readonly loadingMoreText?: string;
  readonly maxVisibleItems?: number;
  readonly itemHeight?: number;
}

/**
 * 약물(ATC) 검색 결과 목록 공통 UI.
 * 외부 ScrollView 안에서 무한스크롤(onScroll 기반)로 동작하며,
 * 로딩·빈 결과·추가 로딩 문구 표시를 일관되게 처리한다.
 */
export function DrugSearchResultList<TItem>({
  items,
  keyExtractor,
  getTitle,
  getMeta,
  onSelect,
  onEndReached,
  isFetching = false,
  isFetchingNextPage = false,
  selectTrigger = "press",
  emptyText = "검색 결과가 없습니다.",
  fetchingText = "검색 중...",
  loadingMoreText = "불러오는 중...",
  maxVisibleItems = DEFAULT_MAX_VISIBLE_ITEMS,
  itemHeight = DEFAULT_ITEM_HEIGHT,
}: DrugSearchResultListProps<TItem>) {
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.metaText}>{isFetching ? fetchingText : emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        testID="drug-search-result-list"
        style={[styles.list, { maxHeight: itemHeight * maxVisibleItems }]}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(event) => {
          if (isCloseToScrollEnd(event.nativeEvent)) {
            onEndReached();
          }
        }}
      >
        {items.map((item) => {
          const title = getTitle(item);
          const meta = getMeta?.(item);
          const handleSelect = () => onSelect(item);
          return (
            <Pressable
              key={keyExtractor(item)}
              accessibilityRole="button"
              accessibilityLabel={`${title} 검색 결과 선택`}
              onPress={selectTrigger === "press" ? handleSelect : undefined}
              onPressIn={selectTrigger === "pressIn" ? handleSelect : undefined}
              style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}
            >
              <Text style={styles.title}>{title}</Text>
              {meta ? <Text style={styles.meta}>{meta}</Text> : null}
            </Pressable>
          );
        })}
        {isFetchingNextPage ? <Text style={styles.metaText}>{loadingMoreText}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.dark_gray,
    backgroundColor: palette.white,
    overflow: "hidden",
  },
  list: {
    flexGrow: 0,
  },
  item: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.dark_gray,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: palette.black,
  },
  meta: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    color: palette.icon,
  },
  metaText: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    lineHeight: 17,
    color: palette.icon,
  },
  pressed: {
    opacity: 0.8,
  },
});

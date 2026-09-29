import { fireEvent, render } from "@testing-library/react-native";
import { DrugSearchResultList } from "@/components/ui/DrugSearchResultList";

interface TestItem {
  readonly id: string;
  readonly title: string;
  readonly meta?: string;
}

const items: readonly TestItem[] = [
  { id: "1", title: "타이레놀정", meta: "한국얀센 · N02BE01" },
  { id: "2", title: "아목시실린캡슐" },
];

function renderList(props?: Partial<React.ComponentProps<typeof DrugSearchResultList<TestItem>>>) {
  const onSelect = jest.fn();
  const onEndReached = jest.fn();
  const view = render(
    <DrugSearchResultList<TestItem>
      items={items}
      keyExtractor={(item) => item.id}
      getTitle={(item) => item.title}
      getMeta={(item) => item.meta}
      onSelect={onSelect}
      onEndReached={onEndReached}
      {...props}
    />,
  );
  return { onSelect, onEndReached, ...view };
}

describe("DrugSearchResultList", () => {
  it("결과 항목을 렌더링하고 접근성 라벨로 선택을 전달한다", () => {
    const { getByLabelText, onSelect } = renderList();

    fireEvent.press(getByLabelText("타이레놀정 검색 결과 선택"));
    expect(onSelect).toHaveBeenCalledWith(items[0]);
  });

  it("meta 가 있는 항목은 meta 텍스트를 렌더링한다", () => {
    const { getByText } = renderList();
    expect(getByText("한국얀센 · N02BE01")).toBeTruthy();
  });

  it("빈 결과에서 fetching 여부에 따라 문구를 전환한다", () => {
    const { getByText, rerender } = render(
      <DrugSearchResultList<TestItem>
        items={[]}
        keyExtractor={(item) => item.id}
        getTitle={(item) => item.title}
        onSelect={jest.fn()}
        onEndReached={jest.fn()}
        isFetching={false}
      />,
    );
    expect(getByText("검색 결과가 없습니다.")).toBeTruthy();

    rerender(
      <DrugSearchResultList<TestItem>
        items={[]}
        keyExtractor={(item) => item.id}
        getTitle={(item) => item.title}
        onSelect={jest.fn()}
        onEndReached={jest.fn()}
        isFetching
      />,
    );
    expect(getByText("검색 중...")).toBeTruthy();
  });

  it("selectTrigger 가 pressIn 이면 pressIn 으로 선택을 전달한다", () => {
    const { getByLabelText, onSelect } = renderList({ selectTrigger: "pressIn" });

    fireEvent(getByLabelText("아목시실린캡슐 검색 결과 선택"), "pressIn");
    expect(onSelect).toHaveBeenCalledWith(items[1]);
  });

  it("스크롤이 끝에 가까워지면 추가 조회를 요청한다", () => {
    const { getByTestId, onEndReached } = renderList();

    fireEvent.scroll(getByTestId("drug-search-result-list"), {
      nativeEvent: {
        contentOffset: { x: 0, y: 80 },
        contentSize: { width: 120, height: 160 },
        layoutMeasurement: { width: 120, height: 100 },
      },
    });

    expect(onEndReached).toHaveBeenCalledTimes(1);
  });
});

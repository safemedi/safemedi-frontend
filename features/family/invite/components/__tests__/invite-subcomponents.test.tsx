import { fireEvent, render } from "@testing-library/react-native";
import { FamilyFeatureBanner } from "../FamilyFeatureBanner";
import { FamilyManageHeader } from "../FamilyManageHeader";
import { FamilyMembersSection } from "../FamilyMembersSection";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    XStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

describe("family invite subcomponents", () => {
  it("FamilyFeatureBanner는 소개 문구를 렌더링한다", () => {
    const { getByText } = render(<FamilyFeatureBanner />);
    expect(getByText("가족 건강 관리 기능")).toBeTruthy();
  });

  it("FamilyManageHeader는 뒤로가기 이벤트를 전달한다", () => {
    const onBack = jest.fn();
    const { getByRole } = render(<FamilyManageHeader onBack={onBack} />);

    fireEvent.press(getByRole("button"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  const noop = () => {};
  const baseSectionProps = {
    editingFamilyId: null,
    relationDraft: "",
    isSavingRelation: false,
    unlinkingFamilyId: null,
    onChangeRelationDraft: noop,
    onStartEdit: noop,
    onCancelEdit: noop,
    onSaveRelation: noop,
    onUnlink: noop,
  };

  it("FamilyMembersSection은 구성원 수와 카드 목록을 렌더링한다", () => {
    const members = [
      { familyId: 1, name: "엄마", relation: "가족" },
      { familyId: 2, name: "아빠", relation: "가족" },
    ];
    const { getByText } = render(<FamilyMembersSection members={members} {...baseSectionProps} />);

    expect(getByText("현재 가족 구성원")).toBeTruthy();
    expect(getByText("2명")).toBeTruthy();
    expect(getByText("엄마")).toBeTruthy();
    expect(getByText("아빠")).toBeTruthy();
  });

  it("FamilyMembersSection은 편집 중인 familyId에만 편집 모드를 전달한다", () => {
    const members = [
      { familyId: 1, name: "엄마", relation: "가족" },
      { familyId: 2, name: "아빠", relation: "아빠" },
    ];
    const onStartEdit = jest.fn();
    const { getByLabelText } = render(
      <FamilyMembersSection
        members={members}
        {...baseSectionProps}
        editingFamilyId={1}
        relationDraft="엄마 최고"
        onStartEdit={onStartEdit}
      />,
    );

    expect(getByLabelText("엄마 호칭 입력").props.value).toBe("엄마 최고");

    fireEvent.press(getByLabelText("아빠 호칭 수정"));
    expect(onStartEdit).toHaveBeenCalledWith(2);
  });
});

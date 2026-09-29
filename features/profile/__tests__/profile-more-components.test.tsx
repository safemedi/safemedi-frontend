import { fireEvent, render } from "@testing-library/react-native";
import { ProfileBasicInfoCard } from "@/features/profile/edit/components/ProfileBasicInfoCard";
import { ProfileEditHeader } from "@/features/profile/edit/components/ProfileEditHeader";
import { ProfileEditNoticeCard } from "@/features/profile/edit/components/ProfileEditNoticeCard";
import { ProfileNicknameCard } from "@/features/profile/edit/components/ProfileNicknameCard";
import { ProfileTagEditorCard } from "@/features/profile/edit/components/ProfileTagEditorCard";
import { HealthInfoCard } from "@/features/profile/view/components/HealthInfoCard";
import { HealthInfoSection } from "@/features/profile/view/components/HealthInfoSection";
import { ProfilePageHeader } from "@/features/profile/view/components/ProfilePageHeader";

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

jest.mock("@/components/ui/SelectChip", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    SelectChip: ({ label, onPress }: { label: string; onPress: () => void }) =>
      React.createElement(Pressable, { onPress }, React.createElement(Text, {}, label)),
  };
});

describe("profile more components", () => {
  it("ProfileEditHeader/ProfileEditNoticeCard 렌더링", () => {
    const onBack = jest.fn();
    const { getByText } = render(
      <>
        <ProfileEditHeader onBack={onBack} />
        <ProfileEditNoticeCard />
      </>,
    );

    expect(getByText("프로필 수정")).toBeTruthy();
    expect(getByText("주의사항")).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();
  });

  it("ProfileNicknameCard 입력 변경 이벤트 전달", () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <ProfileNicknameCard value="홍길동" onChange={onChange} />,
    );

    fireEvent.changeText(getByPlaceholderText("닉네임 입력"), "김철수");
    expect(onChange).toHaveBeenCalledWith("김철수");
  });

  it("ProfileBasicInfoCard 칩 선택 이벤트 전달", () => {
    const onGenderChange = jest.fn();
    const onBloodTypeChange = jest.fn();
    const onRhFactorChange = jest.fn();
    const { getByText } = render(
      <ProfileBasicInfoCard
        gender="female"
        bloodType="A"
        rhFactor="positive"
        onGenderChange={onGenderChange}
        onBloodTypeChange={onBloodTypeChange}
        onRhFactorChange={onRhFactorChange}
      />,
    );

    fireEvent.press(getByText("남성"));
    fireEvent.press(getByText("B형"));
    fireEvent.press(getByText("Rh-"));
    expect(onGenderChange).toHaveBeenCalled();
    expect(onBloodTypeChange).toHaveBeenCalled();
    expect(onRhFactorChange).toHaveBeenCalled();
  });

  it("ProfileTagEditorCard 입력/추가/삭제 이벤트 전달", () => {
    const onInputChange = jest.fn();
    const onAddItem = jest.fn();
    const onRemoveItem = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <ProfileTagEditorCard
        variant="allergy"
        title="알러지"
        items={["꽃가루"]}
        inputValue="견과류"
        inputPlaceholder="알러지를 입력하세요"
        onInputChange={onInputChange}
        onAddItem={onAddItem}
        onRemoveItem={onRemoveItem}
      />,
    );

    fireEvent.changeText(getByPlaceholderText("알러지를 입력하세요"), "해산물");
    expect(onInputChange).toHaveBeenCalledWith("해산물");

    fireEvent(getByPlaceholderText("알러지를 입력하세요"), "submitEditing");
    expect(onAddItem).toHaveBeenCalledWith("견과류");

    fireEvent.press(getByText("+ 땅콩"));
    expect(onAddItem).toHaveBeenCalled();
    expect(onRemoveItem).not.toHaveBeenCalled();
  });

  it("ProfileTagEditorCard 기저질환은 직접 입력 없이 빠른 추가만 제공한다", () => {
    const onInputChange = jest.fn();
    const onAddItem = jest.fn();
    const onRemoveItem = jest.fn();
    const { getByText, queryByPlaceholderText } = render(
      <ProfileTagEditorCard
        variant="chronic"
        title="기저질환"
        items={["천식"]}
        inputValue=""
        inputPlaceholder="기저질환을 입력하세요"
        onInputChange={onInputChange}
        onAddItem={onAddItem}
        onRemoveItem={onRemoveItem}
        inputMode="hidden"
      />,
    );

    expect(queryByPlaceholderText("기저질환을 입력하세요")).toBeNull();

    fireEvent.press(getByText("+ 고혈압"));
    expect(onAddItem).toHaveBeenCalledWith("고혈압");
    expect(onInputChange).not.toHaveBeenCalled();
  });

  it("ProfileTagEditorCard 알러지 검색 결과를 선택해 추가한다", () => {
    const onInputChange = jest.fn();
    const onAddItem = jest.fn();
    const onRemoveItem = jest.fn();
    const onSelectSearchResult = jest.fn();
    const { getByLabelText, getByPlaceholderText, queryByText } = render(
      <ProfileTagEditorCard
        variant="allergy"
        title="알러지"
        items={[]}
        inputValue="페니"
        inputPlaceholder="알러지 검색"
        onInputChange={onInputChange}
        onAddItem={onAddItem}
        onRemoveItem={onRemoveItem}
        inputMode="search"
        isSearchEnabled={true}
        searchResults={[
          {
            id: "D01:J01CA04:페니실린캡슐",
            label: "페니실린캡슐",
            meta: "제약사 · J01CA04",
            type: "ATC_GROUP",
            value: "J01CA04",
            name: "페니실린캡슐",
          },
        ]}
        onSelectSearchResult={onSelectSearchResult}
      />,
    );

    fireEvent.changeText(getByPlaceholderText("알러지 검색"), "페니실린");
    expect(onInputChange).toHaveBeenCalledWith("페니실린");

    fireEvent.press(getByLabelText("페니실린캡슐 검색 결과 선택"));
    expect(onSelectSearchResult).toHaveBeenCalledWith({
      id: "D01:J01CA04:페니실린캡슐",
      label: "페니실린캡슐",
      meta: "제약사 · J01CA04",
      type: "ATC_GROUP",
      value: "J01CA04",
      name: "페니실린캡슐",
    });
    expect(onAddItem).not.toHaveBeenCalled();
    expect(queryByText("검색 결과가 없습니다.")).toBeNull();
  });

  it("HealthInfoCard/HealthInfoSection/ProfilePageHeader 렌더링 및 이벤트 전달", () => {
    const onEdit = jest.fn();
    const onDetailPress = jest.fn();
    const { getByText, getAllByText, getByLabelText } = render(
      <>
        <HealthInfoCard
          variant="allergy"
          icon={null}
          title="알러지"
          items={["꽃가루"]}
          onEdit={onEdit}
        />
        <HealthInfoSection
          allergies={["꽃가루"]}
          chronicConditions={["천식"]}
          onDetailPress={onDetailPress}
        />
        <ProfilePageHeader />
      </>,
    );

    fireEvent.press(getAllByText("편집")[0]);
    fireEvent.press(getByLabelText("건강 정보 상세보기"));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDetailPress).toHaveBeenCalledTimes(1);
    expect(getByText("프로필")).toBeTruthy();
  });
});

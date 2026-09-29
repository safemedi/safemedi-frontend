import { fireEvent, render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { palette } from "@/constants/design-tokens";
import { ProfileEditActionBar } from "@/features/profile/edit/components/ProfileEditActionBar";
import { AppInfoSection } from "@/features/profile/view/components/AppInfoSection";
import { FamilyProfileItem } from "@/features/profile/view/components/FamilyProfileItem";
import {
  type FamilyProfile,
  FamilyProfileSection,
} from "@/features/profile/view/components/FamilyProfileSection";
import { LogoutButton } from "@/features/profile/view/components/LogoutButton";
import { UserHeroCard } from "@/features/profile/view/components/UserHeroCard";
import { WithdrawAccountButton } from "@/features/profile/view/components/WithdrawAccountButton";

jest.mock("tamagui", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
    YStack: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
  };
});

describe("profile subcomponents", () => {
  it("ProfileEditActionBar는 취소/저장 이벤트를 전달한다", () => {
    const onCancel = jest.fn();
    const onSubmit = jest.fn();
    const { getByText, rerender } = render(
      <ProfileEditActionBar onCancel={onCancel} onSubmit={onSubmit} />,
    );

    fireEvent.press(getByText("취소"));
    fireEvent.press(getByText("저장하기"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(<ProfileEditActionBar isSubmitting />);
    expect(getByText("저장 중...")).toBeTruthy();
  });

  it("ProfileEditActionBar는 로그아웃 버튼 수준의 높이를 확보한다", () => {
    const { getByTestId } = render(<ProfileEditActionBar />);

    expect(StyleSheet.flatten(getByTestId("profile-edit-cancel-button").props.style)).toMatchObject(
      {
        height: 44,
      },
    );
    expect(StyleSheet.flatten(getByTestId("profile-edit-submit-button").props.style)).toMatchObject(
      { height: 44 },
    );
  });

  it("AppInfoSection은 리스트 항목과 trailing text를 렌더링한다", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <AppInfoSection
        items={[{ id: "version", label: "앱 버전", trailingText: "1.0.0", onPress }]}
      />,
    );

    expect(getByText("앱 버전")).toBeTruthy();
    expect(getByText("1.0.0")).toBeTruthy();
    fireEvent.press(getByText("앱 버전"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("FamilyProfileItem은 본인이면 이름을, 아니면 호칭과 닉네임을 함께 표시한다", () => {
    const { getByText, rerender } = render(
      <FamilyProfileItem
        name="홍길동"
        relation="본인"
        isActive
        avatarGradient={["#000", "#111"]}
      />,
    );
    expect(getByText("현재 활성")).toBeTruthy();
    expect(getByText("홍길동")).toBeTruthy();

    rerender(
      <FamilyProfileItem
        name="김철수"
        relation="어머니"
        isActive={false}
        avatarGradient={["#000", "#111"]}
      />,
    );
    expect(getByText("어머니 (김철수)")).toBeTruthy();
  });

  it("FamilyProfileSection은 추가 이벤트를 전달한다", () => {
    const onAddFamily = jest.fn();
    const profiles = [
      {
        id: "me",
        name: "본인",
        relation: "본인",
        isActive: true,
        avatarGradient: ["#000", "#111"],
      },
      {
        id: "2",
        name: "김영희",
        relation: "어머니",
        isActive: false,
        avatarGradient: ["#111", "#222"],
      },
    ] satisfies FamilyProfile[];
    const { getByText } = render(
      <FamilyProfileSection profiles={profiles} onAddFamily={onAddFamily} />,
    );

    fireEvent.press(getByText("+ 가족 추가"));
    expect(onAddFamily).toHaveBeenCalledTimes(1);
    expect(getByText("어머니 (김영희)")).toBeTruthy();
  });

  it("LogoutButton/UserHeroCard는 클릭 이벤트를 전달한다", () => {
    const onLogout = jest.fn();
    const onPressHero = jest.fn();
    const heroProps: { name: string; role: string; onPress: () => void } = {
      name: "홍길동",
      role: "주 사용자",
      onPress: onPressHero,
    };
    const { getByText } = render(
      <>
        <LogoutButton onPress={onLogout} />
        <UserHeroCard {...heroProps} />
      </>,
    );

    fireEvent.press(getByText("로그아웃"));
    fireEvent.press(getByText("홍길동"));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onPressHero).toHaveBeenCalledTimes(1);
  });

  it("LogoutButton은 흰색 배경을 사용한다", () => {
    const { getByTestId } = render(<LogoutButton />);

    expect(StyleSheet.flatten(getByTestId("logout-button").props.style)).toMatchObject({
      backgroundColor: palette.white,
    });
  });

  it("WithdrawAccountButton은 로그아웃보다 강조된 위험 톤을 사용한다", () => {
    const { getByTestId } = render(<WithdrawAccountButton />);

    expect(StyleSheet.flatten(getByTestId("withdraw-account-button").props.style)).toMatchObject({
      backgroundColor: palette.warning_allergy_bg,
      borderColor: palette.red_medium,
    });
  });

  it("WithdrawAccountButton은 클릭 이벤트를 전달한다", () => {
    const onPress = jest.fn();
    const { getByText } = render(<WithdrawAccountButton onPress={onPress} />);

    fireEvent.press(getByText("회원 탈퇴"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

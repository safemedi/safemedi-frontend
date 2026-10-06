import { fireEvent, render } from "@testing-library/react-native";
import type { FamilyProfile } from "@/features/profile/view/components/FamilyProfileSection";
import { FamilyProfileSection } from "@/features/profile/view/components/FamilyProfileSection";

jest.mock("tamagui", () => {
  const { View, Text } = require("react-native");
  return { XStack: View, YStack: View, Text };
});

it("가족 항목을 누르면 선택한 가족을 전달하고 본인은 선택하지 않는다", () => {
  const profiles: FamilyProfile[] = [
    {
      id: "me",
      name: "홍길동",
      relation: "본인",
      isActive: true,
      avatarGradient: ["green", "green"],
    },
    {
      id: "12",
      name: "김영희",
      relation: "어머니",
      isActive: false,
      avatarGradient: ["green", "green"],
    },
  ];
  const handleSelect = jest.fn();
  const screen = render(<FamilyProfileSection profiles={profiles} onSelectFamily={handleSelect} />);
  fireEvent.press(screen.getByLabelText("어머니 김영희 오늘 복약 정보"));
  expect(handleSelect).toHaveBeenCalledWith(profiles[1]);
  fireEvent.press(screen.getByLabelText("본인 홍길동 오늘 복약 정보"));
  expect(handleSelect).toHaveBeenCalledTimes(1);
});

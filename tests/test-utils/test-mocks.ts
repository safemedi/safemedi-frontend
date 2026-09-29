import type { User } from "@/stores/userStore";

export const mockUpdateUser = jest.fn();

let mockUser: User | null = null;

export function setMockUser(user: User | null) {
  mockUser = user;
}

export function resetMockStore() {
  mockUser = null;
  mockUpdateUser.mockReset();
}

jest.mock("@/stores/userStore", () => ({
  useUserStore: (
    selector: (state: { user: User | null; updateUser: typeof mockUpdateUser }) => unknown,
  ) => selector({ user: mockUser, updateUser: mockUpdateUser }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("@/components/ui/EmojiCard", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  const MockEmojiCard = ({ label, onPress }: { label: string; onPress: () => void }) =>
    React.createElement(
      Pressable,
      { onPress, accessibilityRole: "button", accessibilityLabel: label },
      React.createElement(Text, null, label),
    );
  return {
    __esModule: true,
    EmojiCard: MockEmojiCard,
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("tamagui", () => {
  const React = require("react");
  const { Pressable, Text, TextInput, View } = require("react-native");

  return {
    Input: ({
      value,
      onChangeText,
      onBlur,
      placeholder,
      onSubmitEditing,
      accessibilityLabel,
    }: {
      value?: string;
      onChangeText?: (text: string) => void;
      onBlur?: () => void;
      placeholder?: string;
      onSubmitEditing?: () => void;
      accessibilityLabel?: string;
    }) =>
      React.createElement(TextInput, {
        value,
        onChangeText,
        onBlur,
        placeholder,
        onSubmitEditing,
        accessibilityLabel,
      }),
    Text: ({ children }: { children: React.ReactNode }) =>
      React.createElement(Text, null, children),
    XStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
    Button: ({
      children,
      onPress,
      accessibilityLabel,
      accessibilityRole = "button",
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      accessibilityLabel?: string;
      accessibilityRole?: "button" | "link";
    }) =>
      React.createElement(
        Pressable,
        { onPress, accessibilityRole, accessibilityLabel },
        typeof children === "string" ? React.createElement(Text, null, children) : children,
      ),
  };
});

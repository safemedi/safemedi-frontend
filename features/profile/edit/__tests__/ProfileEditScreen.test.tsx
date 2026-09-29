import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type {
  useSearchDiseasesQuery,
  useSearchDrugAllergiesQuery,
} from "@/api/queries/health-profile";
import type { User } from "@/stores/userStore";
import { ProfileEditScreen } from "../ProfileEditScreen";

const mockBack = jest.fn();
const mockMutate = jest.fn();
const mockUseSearchDrugAllergiesQuery = jest.fn();
const mockUseSearchDiseasesQuery = jest.fn();

const mockUser: User = {
  id: "me",
  displayName: "홍길동",
  email: null,
  birthDate: "1990-01-01",
  height: 170,
  weight: 65,
  gender: "female",
  bloodType: "AB-",
  allergies: ["페니실린", "해산물", "꽃가루"],
  allergyMappings: {
    꽃가루: { type: "ATC_GROUP", value: "R06AX13", name: "꽃가루" },
  },
  chronicConditions: ["천식", "편두통"],
  isTutorial: true,
};
let mockActiveUser: User | null = mockUser;

jest.mock("expo-router", () => ({
  router: {
    back: mockBack,
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/stores/userStore", () => ({
  useUserStore: (selector: (state: { user: User | null }) => unknown) =>
    selector({
      user: mockActiveUser,
    }),
}));

jest.mock("@/api/queries/user", () => ({
  useUpdateUserProfileMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

jest.mock("@/api/queries/health-profile", () => ({
  useSearchDrugAllergiesQuery: (...args: unknown[]) => mockUseSearchDrugAllergiesQuery(...args),
  useSearchDiseasesQuery: (...args: unknown[]) => mockUseSearchDiseasesQuery(...args),
}));

jest.mock("tamagui", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    YStack: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock("../components/ProfileEditHeader", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  return {
    ProfileEditHeader: ({ onBack }: { onBack: () => void }) =>
      React.createElement(
        Pressable,
        { onPress: onBack, accessibilityRole: "button", accessibilityLabel: "뒤로가기" },
        React.createElement(Text, null, "헤더"),
      ),
  };
});

jest.mock("../components/ProfileNicknameCard", () => {
  const React = require("react");
  const { TextInput } = require("react-native");

  return {
    ProfileNicknameCard: ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
      React.createElement(TextInput, {
        value,
        onChangeText: onChange,
        placeholder: "닉네임",
      }),
  };
});

jest.mock("../components/ProfileBasicInfoCard", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  return {
    ProfileBasicInfoCard: ({
      gender,
      bloodType,
      rhFactor,
    }: {
      gender: string;
      bloodType: string;
      rhFactor: string;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, `기본정보:${gender}:${bloodType}:${rhFactor}`),
      ),
  };
});

jest.mock("../components/ProfileTagEditorCard", () => {
  const React = require("react");
  const { Pressable, Text, TextInput, View } = require("react-native");

  return {
    ProfileTagEditorCard: ({
      title,
      items,
      inputValue,
      inputPlaceholder,
      onInputChange,
      searchResults = [],
      onSelectSearchResult,
    }: {
      title: string;
      items: string[];
      inputValue: string;
      inputPlaceholder: string;
      onInputChange: (value: string) => void;
      searchResults?: { id: string; label: string }[];
      onSelectSearchResult?: (value: { id: string; label: string }) => void;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, `${title}:${items.join(",")}`),
        React.createElement(TextInput, {
          value: inputValue,
          onChangeText: onInputChange,
          placeholder: inputPlaceholder,
        }),
        searchResults.map((result) =>
          React.createElement(
            Pressable,
            {
              key: result.id,
              accessibilityLabel: `${result.label} 검색 결과 선택`,
              onPress: () => onSelectSearchResult?.(result),
            },
            React.createElement(Text, null, result.label),
          ),
        ),
      ),
  };
});

jest.mock("../components/ProfileEditNoticeCard", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ProfileEditNoticeCard: () => React.createElement(Text, null, "안내문구"),
  };
});

jest.mock("../components/ProfileEditActionBar", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");

  return {
    ProfileEditActionBar: ({
      onCancel,
      onSubmit,
    }: {
      onCancel: () => void;
      onSubmit: () => void;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(
          Pressable,
          { onPress: onCancel, accessibilityRole: "button", accessibilityLabel: "취소" },
          React.createElement(Text, null, "취소"),
        ),
        React.createElement(
          Pressable,
          { onPress: onSubmit, accessibilityRole: "button", accessibilityLabel: "저장" },
          React.createElement(Text, null, "저장"),
        ),
      ),
  };
});

describe("프로필 수정 화면", () => {
  beforeEach(() => {
    mockActiveUser = mockUser;
    jest.clearAllMocks();
    const emptySearchResult = {
      items: [],
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    };
    mockUseSearchDrugAllergiesQuery.mockReturnValue(
      emptySearchResult as unknown as ReturnType<typeof useSearchDrugAllergiesQuery>,
    );
    mockUseSearchDiseasesQuery.mockReturnValue(
      emptySearchResult as unknown as ReturnType<typeof useSearchDiseasesQuery>,
    );
  });

  it("사용자 정보가 없으면 빈 기본값으로 편집 화면을 렌더링한다", () => {
    mockActiveUser = null;

    const { getAllByDisplayValue } = render(<ProfileEditScreen />);

    expect(getAllByDisplayValue("").length).toBeGreaterThan(0);
  });

  it("유저 기본값을 폼에 표시한다", () => {
    const { getByDisplayValue, getByText } = render(<ProfileEditScreen />);

    expect(getByDisplayValue("홍길동")).toBeTruthy();
    expect(getByText("기본정보:female:AB:negative")).toBeTruthy();
    expect(getByText("알러지:페니실린,해산물,꽃가루")).toBeTruthy();
    expect(getByText("기저질환:천식,편두통")).toBeTruthy();
  });

  it("하단 액션 영역 여백을 과하게 남기지 않는다", () => {
    const { getByTestId } = render(<ProfileEditScreen />);

    expect(
      StyleSheet.flatten(getByTestId("profile-edit-scroll").props.contentContainerStyle),
    ).toMatchObject({
      paddingBottom: 16,
    });
  });

  it("매핑 없이 store에만 있는 비대표 알러지도 유지한다", async () => {
    mockActiveUser = {
      ...mockUser,
      allergies: ["페니실린", "꽃가루"],
      allergyMappings: undefined,
    };

    const { getByText, getByLabelText } = render(<ProfileEditScreen />);

    expect(getByText("알러지:페니실린,꽃가루")).toBeTruthy();

    fireEvent.press(getByLabelText("저장"));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          allergies: expect.arrayContaining([
            { type: "FOOD", value: "페니실린", name: "페니실린" },
            { type: "FOOD", value: "꽃가루", name: "꽃가루" },
          ]),
        }),
        expect.any(Object),
      );
    });
  });

  it("저장 버튼을 누르면 변환된 payload로 mutate를 호출한다", async () => {
    const { getByLabelText } = render(<ProfileEditScreen />);

    fireEvent.press(getByLabelText("저장"));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          nickname: "홍길동",
          gender: "FEMALE",
          bloodType: "AB",
          rhType: "MINUS",
          diseaseCodes: ["COND010"],
          allergies: [
            { type: "FOOD", value: "페니실린", name: "페니실린" },
            { type: "FOOD", value: "해산물", name: "해산물" },
            { type: "ATC_GROUP", value: "R06AX13", name: "꽃가루" },
          ],
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });
  });

  it("검색으로 선택한 기저질환은 diseaseCode로 저장한다", async () => {
    mockUseSearchDiseasesQuery.mockReturnValue({
      items: [{ diseaseCode: "G43", diseaseName: "편두통" }],
      isFetching: false,
      isFetchingNextPage: false,
      isError: false,
      error: null,
      hasNextPage: false,
      fetchNextPage: jest.fn(),
    } as unknown as ReturnType<typeof useSearchDiseasesQuery>);
    mockActiveUser = {
      ...mockUser,
      chronicConditions: ["천식"],
    };

    const { getByPlaceholderText, getByLabelText } = render(<ProfileEditScreen />);

    fireEvent.changeText(getByPlaceholderText("새 기저질환 입력"), "편두");
    fireEvent.press(getByLabelText("편두통 검색 결과 선택"));
    fireEvent.press(getByLabelText("저장"));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          diseaseCodes: ["COND010", "G43"],
        }),
        expect.any(Object),
      );
    });
  });
});

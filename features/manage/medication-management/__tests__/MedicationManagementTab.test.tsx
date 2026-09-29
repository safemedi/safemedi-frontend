import { fireEvent, render } from "@testing-library/react-native";
import { MedicationManagementTab } from "../MedicationManagementTab";
import { useMedicationManagementViewModel } from "../useMedicationManagementViewModel";

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
jest.mock("@/components/ui/PillButton", () => {
  const React = require("react");
  const { Pressable } = require("react-native");
  return {
    PillButton: ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) =>
      React.createElement(Pressable, { accessibilityLabel: "재시도", onPress }, children),
  };
});
jest.mock("../useMedicationManagementViewModel", () => ({
  useMedicationManagementViewModel: jest.fn(),
}));
jest.mock("../components/MedicationManagementSectionHeader", () => ({
  MedicationManagementSectionHeader: () => null,
}));
jest.mock("../components/MedicationManagementTipCard", () => ({
  MedicationManagementTipCard: () => null,
}));
jest.mock("../components/MedicationPrescriptionGroupCard", () => ({
  MedicationPrescriptionGroupCard: () => null,
}));

const mockViewModel = useMedicationManagementViewModel as jest.MockedFunction<
  typeof useMedicationManagementViewModel
>;
const refetch = jest.fn(async () => ({}));
const base = {
  prescriptionGroups: [],
  isPrescriptionExpanded: () => true,
  editingPrescriptionId: null,
  prescriptionTitleDraft: "",
  editingMedicationKey: null,
  editDraft: null,
  isMedicationEditing: () => false,
  isPrescriptionTitleEditing: () => false,
  isPrescriptionTitleSaveEnabled: false,
  isSaveEditEnabled: false,
  isLoading: false,
  isError: false,
  isMutating: false,
  refetch,
  togglePrescriptionExpanded: jest.fn(),
  startEditPrescriptionTitle: jest.fn(),
  changePrescriptionTitleDraft: jest.fn(),
  cancelEditPrescriptionTitle: jest.fn(),
  savePrescriptionTitle: jest.fn(),
  startEditMedication: jest.fn(),
  cancelEditMedication: jest.fn(),
  toggleEditTakeSlot: jest.fn(),
  saveEditMedication: jest.fn(),
  handleDeletePrescription: jest.fn(),
};

describe("데이터가 없으면 기본값을 반환한다.", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockViewModel.mockReturnValue(base);
  });
  it("로딩, 오류 재시도, 빈 목록 상태를 표시한다", () => {
    mockViewModel.mockReturnValue({ ...base, isLoading: true });
    const { getByText, rerender, getByLabelText } = render(<MedicationManagementTab />);
    expect(getByText("복약 관리 정보를 불러오는 중입니다.")).toBeTruthy();
    mockViewModel.mockReturnValue({ ...base, isError: true });
    rerender(<MedicationManagementTab />);
    fireEvent.press(getByLabelText("재시도"));
    expect(refetch).toHaveBeenCalled();
    mockViewModel.mockReturnValue(base);
    rerender(<MedicationManagementTab />);
    expect(getByText("등록된 처방전이 없습니다")).toBeTruthy();
  });
});

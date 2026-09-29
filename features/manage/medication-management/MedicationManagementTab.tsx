import { StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PillButton } from "@/components/ui/PillButton";
import { palette } from "@/constants/design-tokens";
import { MedicationManagementSectionHeader } from "./components/MedicationManagementSectionHeader";
import { MedicationManagementTipCard } from "./components/MedicationManagementTipCard";
import { MedicationPrescriptionGroupCard } from "./components/MedicationPrescriptionGroupCard";
import { useMedicationManagementViewModel } from "./useMedicationManagementViewModel";

export function MedicationManagementTab() {
  const viewModel = useMedicationManagementViewModel();

  if (viewModel.isLoading) {
    return (
      <YStack style={styles.feedbackBox} gap={10}>
        <LoadingSpinner accessibilityLabel="복약 관리 정보 로딩 중" />
        <Text style={styles.feedbackText}>복약 관리 정보를 불러오는 중입니다.</Text>
      </YStack>
    );
  }

  if (viewModel.isError) {
    return (
      <YStack style={styles.feedbackBox} gap={10}>
        <Text style={styles.feedbackText}>복약 관리 정보를 불러오지 못했습니다.</Text>
        <PillButton variant="outline" onPress={() => viewModel.refetch()} flex={0}>
          <Text style={styles.retryText}>다시 시도</Text>
        </PillButton>
      </YStack>
    );
  }

  return (
    <YStack gap={14}>
      <MedicationManagementSectionHeader />

      {viewModel.prescriptionGroups.length > 0 ? (
        <YStack gap={10}>
          {viewModel.prescriptionGroups.map((group) => (
            <MedicationPrescriptionGroupCard
              key={group.id}
              title={group.title}
              medicationCountLabel={group.medicationCountLabel}
              medications={group.medications}
              isExpanded={viewModel.isPrescriptionExpanded(group.prescriptionId)}
              isTitleEditing={viewModel.isPrescriptionTitleEditing(group.prescriptionId)}
              titleDraft={viewModel.prescriptionTitleDraft}
              isMedicationEditing={(medicationId) =>
                viewModel.isMedicationEditing(group.prescriptionId, medicationId)
              }
              editDraft={viewModel.editDraft}
              isTitleSaveEnabled={viewModel.isPrescriptionTitleSaveEnabled}
              isSaveEditEnabled={viewModel.isSaveEditEnabled}
              isSaving={viewModel.isMutating}
              onToggleExpanded={() => viewModel.togglePrescriptionExpanded(group.prescriptionId)}
              onStartEditTitle={() => viewModel.startEditPrescriptionTitle(group.prescriptionId)}
              onChangeTitleDraft={viewModel.changePrescriptionTitleDraft}
              onCancelEditTitle={viewModel.cancelEditPrescriptionTitle}
              onSaveEditTitle={viewModel.savePrescriptionTitle}
              onDeletePrescription={() =>
                viewModel.handleDeletePrescription(group.prescriptionId, group.title)
              }
              onStartEditMedication={(medicationId) =>
                viewModel.startEditMedication(group.prescriptionId, medicationId)
              }
              onCancelEditMedication={viewModel.cancelEditMedication}
              onSaveEditMedication={viewModel.saveEditMedication}
              onToggleEditTakeSlot={viewModel.toggleEditTakeSlot}
            />
          ))}
        </YStack>
      ) : (
        <YStack style={styles.emptyBox} gap={6}>
          <Text style={styles.emptyTitle}>등록된 처방전이 없습니다</Text>
          <Text style={styles.emptyDescription}>처방전 스캔으로 약물을 등록해 보세요.</Text>
        </YStack>
      )}

      <MedicationManagementTipCard />
    </YStack>
  );
}

const styles = StyleSheet.create({
  feedbackBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
  },
  feedbackText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  retryText: {
    color: palette.green_deep,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },
  emptyTitle: {
    color: palette.title_emphasis,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  emptyDescription: {
    color: palette.icon,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
    textAlign: "center",
  },
});

import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import { getApiErrorMessage } from "@/api/error";
import {
  useDeletePrescriptionMutation,
  usePrescriptionsQuery,
  useUpdatePrescriptionMutation,
} from "@/api/queries/prescriptions";
import type { MedicationTakeSlot } from "@/features/scan/prescription-scan-result/usePrescriptionScanResultViewModel";
import { getPrescriptionTitleError } from "@/utils/prescription";
import {
  buildUpdatedMedicationsAfterEdit,
  createMedicationEditDraft,
  createMedicationEditKey,
  isMedicationEditDraftSavable,
  isMedicationEditing,
  type MedicationEditDraft,
  type MedicationEditKey,
  toggleMedicationEditTakeSlot,
  validateMedicationEditDraft,
} from "./medicationEditModel";
import {
  isPrescriptionExpanded,
  type MedicationManagementViewModel,
  mapPrescriptionsToManagementGroups,
  toggleCollapsedPrescriptionId,
} from "./medicationManagementModel";

export function useMedicationManagementViewModel(): MedicationManagementViewModel {
  const prescriptionsQuery = usePrescriptionsQuery();
  const updatePrescriptionMutation = useUpdatePrescriptionMutation();
  const deletePrescriptionMutation = useDeletePrescriptionMutation();

  const [collapsedPrescriptionIds, setCollapsedPrescriptionIds] = useState<ReadonlySet<number>>(
    () => new Set<number>(),
  );
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<number | null>(null);
  const [prescriptionTitleDraft, setPrescriptionTitleDraft] = useState("");
  const [editingMedicationKey, setEditingMedicationKey] = useState<MedicationEditKey | null>(null);
  const [editDraft, setEditDraft] = useState<MedicationEditDraft | null>(null);

  const prescriptions = prescriptionsQuery.data?.prescriptions ?? [];

  const prescriptionGroups = useMemo(
    () => mapPrescriptionsToManagementGroups(prescriptions),
    [prescriptions],
  );

  const isSaveEditEnabled = useMemo(() => isMedicationEditDraftSavable(editDraft), [editDraft]);
  const isPrescriptionTitleSaveEnabled = useMemo(() => {
    const currentPrescription = prescriptions.find(
      (item) => item.prescriptionId === editingPrescriptionId,
    );
    const nextTitle = prescriptionTitleDraft.trim();
    return (
      !!currentPrescription &&
      getPrescriptionTitleError(nextTitle, "이름") === null &&
      nextTitle !== currentPrescription.title
    );
  }, [editingPrescriptionId, prescriptionTitleDraft, prescriptions]);

  const handleTogglePrescriptionExpanded = useCallback((prescriptionId: number) => {
    setCollapsedPrescriptionIds((currentIds) =>
      toggleCollapsedPrescriptionId(currentIds, prescriptionId),
    );
  }, []);

  const checkPrescriptionExpanded = useCallback(
    (prescriptionId: number) => isPrescriptionExpanded(collapsedPrescriptionIds, prescriptionId),
    [collapsedPrescriptionIds],
  );

  const checkPrescriptionTitleEditing = useCallback(
    (prescriptionId: number) => editingPrescriptionId === prescriptionId,
    [editingPrescriptionId],
  );

  const checkMedicationEditing = useCallback(
    (prescriptionId: number, medicationId: number) =>
      isMedicationEditing(editingMedicationKey, prescriptionId, medicationId),
    [editingMedicationKey],
  );

  const handleCancelEditMedication = useCallback(() => {
    setEditingMedicationKey(null);
    setEditDraft(null);
  }, []);

  const handleCancelEditPrescriptionTitle = useCallback(() => {
    setEditingPrescriptionId(null);
    setPrescriptionTitleDraft("");
  }, []);

  const handleStartEditPrescriptionTitle = useCallback(
    (prescriptionId: number) => {
      const prescription = prescriptions.find((item) => item.prescriptionId === prescriptionId);
      if (!prescription) {
        return;
      }

      handleCancelEditMedication();
      setCollapsedPrescriptionIds((currentIds) => {
        if (!currentIds.has(prescriptionId)) {
          return currentIds;
        }
        const nextIds = new Set(currentIds);
        nextIds.delete(prescriptionId);
        return nextIds;
      });
      setEditingPrescriptionId(prescriptionId);
      setPrescriptionTitleDraft(prescription.title);
    },
    [handleCancelEditMedication, prescriptions],
  );

  const handleSavePrescriptionTitle = useCallback(() => {
    if (editingPrescriptionId === null) {
      return;
    }

    const nextTitle = prescriptionTitleDraft.trim();
    const titleError = getPrescriptionTitleError(nextTitle, "이름");
    if (titleError) {
      Alert.alert("입력 확인", titleError);
      return;
    }

    const prescription = prescriptions.find(
      (item) => item.prescriptionId === editingPrescriptionId,
    );
    if (!prescription) {
      return;
    }

    if (nextTitle === prescription.title) {
      handleCancelEditPrescriptionTitle();
      return;
    }

    updatePrescriptionMutation.mutate(
      {
        prescriptionId: editingPrescriptionId,
        body: { title: nextTitle },
      },
      {
        onSuccess: () => {
          handleCancelEditPrescriptionTitle();
        },
        onError: async (error) => {
          const message = await getApiErrorMessage(
            error,
            "처방전 이름 수정에 실패했습니다. 잠시 후 다시 시도해주세요.",
          );
          Alert.alert("저장 실패", message);
        },
      },
    );
  }, [
    editingPrescriptionId,
    handleCancelEditPrescriptionTitle,
    prescriptionTitleDraft,
    prescriptions,
    updatePrescriptionMutation,
  ]);

  const handleStartEditMedication = useCallback(
    (prescriptionId: number, medicationId: number) => {
      const prescription = prescriptions.find((item) => item.prescriptionId === prescriptionId);
      if (!prescription) {
        return;
      }

      const nextDraft = createMedicationEditDraft(prescription, medicationId);
      if (!nextDraft) {
        return;
      }

      handleCancelEditPrescriptionTitle();
      setEditingMedicationKey(createMedicationEditKey(prescriptionId, medicationId));
      setEditDraft(nextDraft);
    },
    [handleCancelEditPrescriptionTitle, prescriptions],
  );

  const handleToggleEditTakeSlot = useCallback((slot: MedicationTakeSlot) => {
    setEditDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }
      return toggleMedicationEditTakeSlot(currentDraft, slot);
    });
  }, []);

  const handleSaveEditMedication = useCallback(() => {
    if (!editingMedicationKey || !editDraft) {
      return;
    }

    const validation = validateMedicationEditDraft(editDraft);
    if (!validation.isValid) {
      Alert.alert("입력 확인", validation.message ?? "입력값을 확인해주세요.");
      return;
    }

    const prescription = prescriptions.find(
      (item) => item.prescriptionId === editingMedicationKey.prescriptionId,
    );
    if (!prescription) {
      return;
    }

    updatePrescriptionMutation.mutate(
      {
        prescriptionId: editingMedicationKey.prescriptionId,
        body: {
          medications: buildUpdatedMedicationsAfterEdit(
            prescription,
            editingMedicationKey.medicationId,
            editDraft,
          ),
        },
      },
      {
        onSuccess: () => {
          setEditingMedicationKey(null);
          setEditDraft(null);
        },
        onError: async (error) => {
          const message = await getApiErrorMessage(
            error,
            "약물 수정에 실패했습니다. 잠시 후 다시 시도해주세요.",
          );
          Alert.alert("저장 실패", message);
        },
      },
    );
  }, [editDraft, editingMedicationKey, prescriptions, updatePrescriptionMutation]);

  const handleDeletePrescription = useCallback(
    (prescriptionId: number, title: string) => {
      if (editingMedicationKey?.prescriptionId === prescriptionId) {
        handleCancelEditMedication();
      }
      if (editingPrescriptionId === prescriptionId) {
        handleCancelEditPrescriptionTitle();
      }

      Alert.alert("처방전 삭제", `'${title}' 처방전과 예정된 복약 스케줄을 삭제할까요?`, [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: () => {
            deletePrescriptionMutation.mutate(prescriptionId, {
              onError: async (error) => {
                const message = await getApiErrorMessage(
                  error,
                  "처방전 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.",
                );
                Alert.alert("삭제 실패", message);
              },
            });
          },
        },
      ]);
    },
    [
      deletePrescriptionMutation,
      editingMedicationKey,
      editingPrescriptionId,
      handleCancelEditMedication,
      handleCancelEditPrescriptionTitle,
    ],
  );

  return {
    prescriptionGroups,
    isPrescriptionExpanded: checkPrescriptionExpanded,
    editingPrescriptionId,
    prescriptionTitleDraft,
    editingMedicationKey,
    editDraft,
    isMedicationEditing: checkMedicationEditing,
    isPrescriptionTitleEditing: checkPrescriptionTitleEditing,
    isPrescriptionTitleSaveEnabled,
    isSaveEditEnabled,
    isLoading: prescriptionsQuery.isLoading,
    isError: prescriptionsQuery.isError,
    isMutating: updatePrescriptionMutation.isPending || deletePrescriptionMutation.isPending,
    refetch: () => prescriptionsQuery.refetch(),
    togglePrescriptionExpanded: handleTogglePrescriptionExpanded,
    startEditPrescriptionTitle: handleStartEditPrescriptionTitle,
    changePrescriptionTitleDraft: setPrescriptionTitleDraft,
    cancelEditPrescriptionTitle: handleCancelEditPrescriptionTitle,
    savePrescriptionTitle: handleSavePrescriptionTitle,
    startEditMedication: handleStartEditMedication,
    cancelEditMedication: handleCancelEditMedication,
    toggleEditTakeSlot: handleToggleEditTakeSlot,
    saveEditMedication: handleSaveEditMedication,
    handleDeletePrescription,
  };
}

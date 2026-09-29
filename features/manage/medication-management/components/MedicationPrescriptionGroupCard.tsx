import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type { MedicationTakeSlot } from "@/features/scan/prescription-scan-result/usePrescriptionScanResultViewModel";
import { PRESCRIPTION_TITLE_MAX_LENGTH } from "@/utils/prescription";
import type { MedicationEditDraft } from "../medicationEditModel";
import type { MedicationManagementMedicationItem } from "../medicationManagementModel";
import { MedicationManagementItemCard } from "./MedicationManagementItemCard";

interface MedicationPrescriptionGroupCardProps {
  readonly title: string;
  readonly medicationCountLabel: string;
  readonly medications: readonly MedicationManagementMedicationItem[];
  readonly isExpanded: boolean;
  readonly isTitleEditing: boolean;
  readonly titleDraft: string;
  readonly isMedicationEditing: (medicationId: number) => boolean;
  readonly editDraft: MedicationEditDraft | null;
  readonly isTitleSaveEnabled: boolean;
  readonly isSaveEditEnabled: boolean;
  readonly isSaving: boolean;
  readonly onToggleExpanded: () => void;
  readonly onStartEditTitle: () => void;
  readonly onChangeTitleDraft: (title: string) => void;
  readonly onCancelEditTitle: () => void;
  readonly onSaveEditTitle: () => void;
  readonly onDeletePrescription: () => void;
  readonly onStartEditMedication: (medicationId: number) => void;
  readonly onCancelEditMedication: () => void;
  readonly onSaveEditMedication: () => void;
  readonly onToggleEditTakeSlot: (slot: MedicationTakeSlot) => void;
}

export function MedicationPrescriptionGroupCard({
  title,
  medicationCountLabel,
  medications,
  isExpanded,
  isTitleEditing,
  titleDraft,
  isMedicationEditing,
  editDraft,
  isTitleSaveEnabled,
  isSaveEditEnabled,
  isSaving,
  onToggleExpanded,
  onStartEditTitle,
  onChangeTitleDraft,
  onCancelEditTitle,
  onSaveEditTitle,
  onDeletePrescription,
  onStartEditMedication,
  onCancelEditMedication,
  onSaveEditMedication,
  onToggleEditTakeSlot,
}: MedicationPrescriptionGroupCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <LinearGradient
        colors={[palette.blue, palette.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} ${isExpanded ? "접기" : "펼치기"}`}
          onPress={onToggleExpanded}
          style={styles.headerMain}
        >
          <MaterialCommunityIcons name="clipboard-text-outline" size={18} color={palette.white} />
          <Text style={styles.headerTitle}>📋 {title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{medicationCountLabel}</Text>
          </View>
        </Pressable>

        <XStack items="center" gap={7}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title} 처방전 이름 수정`}
            onPress={onStartEditTitle}
            style={styles.iconButton}
          >
            <Ionicons name="create-outline" size={17} color={palette.white} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title} ${isExpanded ? "접기" : "펼치기"}`}
            onPress={onToggleExpanded}
            style={styles.iconButton}
          >
            <Ionicons
              name={isExpanded ? "chevron-down" : "chevron-forward"}
              size={16}
              color={palette.white}
            />
          </Pressable>
        </XStack>
      </LinearGradient>

      {isExpanded ? (
        <YStack gap={10} p={10} style={styles.body}>
          {isTitleEditing ? (
            <YStack gap={9} style={styles.titleEditor}>
              <Text style={styles.titleEditorLabel}>처방전 이름</Text>
              <TextInput
                accessibilityLabel={`${title} 처방전 이름 입력`}
                value={titleDraft}
                onChangeText={onChangeTitleDraft}
                placeholder="처방전 이름을 입력해주세요"
                placeholderTextColor={palette.icon}
                maxLength={PRESCRIPTION_TITLE_MAX_LENGTH}
                style={styles.titleInput}
                editable={!isSaving}
                returnKeyType="done"
                onSubmitEditing={isTitleSaveEnabled ? onSaveEditTitle : undefined}
              />
              <XStack gap={7}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="처방전 이름 수정 취소"
                  onPress={onCancelEditTitle}
                  style={({ pressed }) => [
                    styles.titleActionButton,
                    styles.titleCancelButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.titleCancelButtonText}>취소</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="처방전 이름 수정 저장"
                  disabled={!isTitleSaveEnabled || isSaving}
                  onPress={onSaveEditTitle}
                  style={({ pressed }) => [
                    styles.titleActionButton,
                    styles.titleSaveButton,
                    (!isTitleSaveEnabled || isSaving) && styles.disabledButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.titleSaveButtonText}>{isSaving ? "저장 중..." : "저장"}</Text>
                </Pressable>
              </XStack>
            </YStack>
          ) : null}

          {medications.map((medication) => {
            const isEditing = isMedicationEditing(medication.medicationId);
            return (
              <MedicationManagementItemCard
                key={medication.id}
                medication={medication}
                isEditing={isEditing}
                editDraft={isEditing ? editDraft : null}
                isSaveEnabled={isSaveEditEnabled}
                isSaving={isSaving && isEditing}
                onEdit={() => onStartEditMedication(medication.medicationId)}
                onCancelEdit={onCancelEditMedication}
                onSaveEdit={onSaveEditMedication}
                onToggleTakeSlot={onToggleEditTakeSlot}
              />
            );
          })}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title} 처방전 삭제`}
            onPress={onDeletePrescription}
            style={({ pressed }) => [styles.deletePrescriptionButton, pressed && styles.pressed]}
          >
            <Ionicons name="trash-outline" size={14} color={palette.red_quick_text} />
            <Text style={styles.deletePrescriptionButtonText}>처방전 삭제</Text>
          </Pressable>
        </YStack>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    backgroundColor: palette.overlay_white_90,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  headerTitle: {
    color: palette.white,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    flexShrink: 1,
  },
  countBadge: {
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    backgroundColor: palette.overlay_white_20,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    color: palette.white,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  iconButton: {
    width: 24,
    height: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    backgroundColor: palette.overlay_white_50,
  },
  titleEditor: {
    borderWidth: 1,
    borderColor: palette.light_green,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: palette.white,
  },
  titleEditorLabel: {
    color: palette.title_emphasis,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  titleInput: {
    borderWidth: 1,
    borderColor: palette.dark_gray,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: palette.title_emphasis,
    backgroundColor: palette.gray,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  titleActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
  },
  titleCancelButton: {
    borderColor: palette.dark_gray,
    backgroundColor: palette.white,
  },
  titleSaveButton: {
    borderColor: palette.green_soft,
    backgroundColor: palette.gray,
  },
  titleCancelButtonText: {
    color: palette.black,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  titleSaveButtonText: {
    color: palette.green_deep,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  deletePrescriptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: palette.red_outline,
    borderRadius: 12,
    paddingVertical: 9,
    backgroundColor: palette.warning_allergy_bg,
  },
  deletePrescriptionButtonText: {
    color: palette.red_quick_text,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
  },
});

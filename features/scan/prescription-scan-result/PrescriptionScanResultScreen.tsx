import Ionicons from "@expo/vector-icons/Ionicons";
import { Controller } from "react-hook-form";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";
import { GradientCard } from "@/components/ui/GradientCard";
import { PillButton } from "@/components/ui/PillButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { PrescriptionScanHeader } from "@/features/scan/prescription-scan/components/PrescriptionScanHeader";
import { PRESCRIPTION_TITLE_MAX_LENGTH } from "@/utils/prescription";
import { MedicationEditorCard } from "./components/MedicationEditorCard";
import { PrescriptionPeriodCard } from "./components/PrescriptionPeriodCard";
import { usePrescriptionScanResultViewModel } from "./usePrescriptionScanResultViewModel";

const POSITIVE_GRADIENT = [palette.green, palette.opal] as const;
const ADD_GRADIENT = [palette.purple, palette.pink] as const;

export function PrescriptionScanResultScreen() {
  const insets = useSafeAreaInsets();
  const viewModel = usePrescriptionScanResultViewModel();

  return (
    <YStack style={styles.screen}>
      <GradientCard
        gradientColors={palette.bg_pink_line}
        style={{ ...StyleSheet.absoluteFillObject }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View />
      </GradientCard>

      <YStack style={{ paddingTop: insets.top }}>
        <PrescriptionScanHeader onPressClose={viewModel.handlePressClose} title="복약 등록" />
      </YStack>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <YStack gap={12}>
          {viewModel.isManualInputMode ? null : viewModel.hasLowConfidenceExtraction ? (
            <SurfaceCard style={styles.lowConfidenceCard}>
              <View style={styles.lowConfidenceRow}>
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color={palette.warning_interaction_title}
                />
                <YStack gap={2} flex={1}>
                  <Text style={styles.lowConfidenceTitle}>약물을 정확히 인식하지 못했어요</Text>
                  <Text style={styles.lowConfidenceDescription}>
                    약물명을 검색해서 선택하거나, 사진이 흐릿하다면 다시 스캔해 주세요.
                  </Text>
                </YStack>
              </View>
            </SurfaceCard>
          ) : (
            <GradientCard gradientColors={POSITIVE_GRADIENT} style={styles.successCard}>
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle-outline" size={20} color={palette.white} />
                <YStack gap={2}>
                  <Text style={styles.successTitle}>텍스트 인식 완료!</Text>
                  <Text style={styles.successDescription}>
                    {viewModel.recognizedMedicationCount}개의 약물을 찾았어요
                  </Text>
                </YStack>
              </View>
            </GradientCard>
          )}

          <SurfaceCard style={styles.titleCard}>
            <Text style={styles.cardTitle}>처방전 제목</Text>
            <Controller
              control={viewModel.control}
              name="title"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  placeholder="약국 처방"
                  placeholderTextColor={palette.input_placeholder}
                  maxLength={PRESCRIPTION_TITLE_MAX_LENGTH}
                  style={styles.titleInput}
                />
              )}
            />
          </SurfaceCard>

          <PrescriptionPeriodCard
            startDateLabel={viewModel.startDateLabel}
            endDateLabel={viewModel.endDateLabel}
            startDateValue={viewModel.startDateValue}
            endDateValue={viewModel.endDateValue}
            onSelectDate={viewModel.handleSelectPrescriptionDate}
          />

          <YStack gap={10}>
            <SectionHeader
              icon={<Ionicons name="sparkles-outline" size={14} color={palette.purple} />}
              title="인식된 약물"
              action={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="약물 추가"
                  onPress={viewModel.handlePressAddMedication}
                  style={({ pressed }) => [
                    styles.addButtonPressable,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <GradientCard gradientColors={ADD_GRADIENT} style={styles.addButton}>
                    <Ionicons name="add" size={12} color={palette.white} />
                    <Text style={styles.addButtonText}>추가</Text>
                  </GradientCard>
                </Pressable>
              }
            />

            {viewModel.fields.map((field, index) => {
              const isExpanded = viewModel.editingMedicationIndex === index;
              return (
                <MedicationEditorCard
                  key={field.id}
                  index={index}
                  control={viewModel.control}
                  isExpanded={isExpanded}
                  onPressRemove={() => viewModel.handlePressRemoveMedication(index)}
                  onPressEdit={() => viewModel.handlePressEditMedication(index)}
                  onPressComplete={viewModel.handlePressCompleteMedicationEdit}
                  onChangeMedicationName={viewModel.handleChangeMedicationName}
                  onSelectMedicationDrug={viewModel.handleSelectMedicationDrug}
                  onToggleMedicationTakeSlot={viewModel.handleToggleMedicationTakeSlot}
                />
              );
            })}
          </YStack>

          <SurfaceCard style={styles.noticeCard}>
            <View style={styles.noticeRow}>
              <Ionicons name="alert-circle-outline" size={16} color={palette.orange} />
              <YStack gap={4} flex={1}>
                <Text style={styles.noticeTitle}>약물 정보 수정 가능</Text>
                <Text style={styles.noticeDescription}>
                  약물명은 검색 결과에서 선택하고, 복약 시간을 입력해 주세요.
                </Text>
              </YStack>
            </View>
          </SurfaceCard>
        </YStack>
      </ScrollView>

      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.bottomActionRow}>
          <PillButton
            variant="outline"
            onPress={viewModel.handlePressRetryScan}
            accessibilityLabel="다시 스캔"
            borderColor={palette.border_muted}
            backgroundColor={palette.surface_subtle}
          >
            <Text style={styles.retryText}>다시 스캔</Text>
          </PillButton>
          <PillButton
            variant="solid"
            onPress={viewModel.handlePressAnalyze}
            accessibilityLabel="성분 분석하기"
            backgroundColor={palette.green}
            disabled={viewModel.isSubmitting || viewModel.isAnalyzeDisabled}
          >
            <Text style={styles.submitText}>
              {viewModel.isSubmitting ? "분석 중..." : "성분 분석하기"}
            </Text>
          </PillButton>
        </View>
      </View>
    </YStack>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 24,
  },
  successCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  successRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  successTitle: {
    color: palette.white,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  successDescription: {
    color: palette.white,
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
  lowConfidenceCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: palette.warning_interaction_bg,
    borderColor: palette.warning_interaction_border,
  },
  lowConfidenceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  lowConfidenceTitle: {
    color: palette.warning_interaction_title,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  lowConfidenceDescription: {
    color: palette.warning_interaction_message,
    fontSize: 12,
    lineHeight: 17,
  },
  titleCard: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    gap: 10,
  },
  cardTitle: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  titleInput: {
    backgroundColor: palette.gray,
    borderWidth: 1,
    borderColor: palette.surface_card_border,
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 14,
    lineHeight: 20,
    includeFontPadding: false,
    textAlignVertical: "center",
    color: palette.black,
  },
  addButtonPressable: {
    borderRadius: 12,
  },
  addButton: {
    borderRadius: 12,
    minHeight: 28,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  addButtonText: {
    color: palette.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  noticeCard: {
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: palette.notice_bg_start,
    borderColor: palette.notice_border,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noticeTitle: {
    color: palette.notice_title,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  noticeDescription: {
    color: palette.notice_description,
    fontSize: 11,
    lineHeight: 16,
  },
  bottomActionBar: {
    borderTopWidth: 1,
    borderTopColor: palette.dark_gray,
    backgroundColor: palette.overlay_white_90,
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  bottomActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  retryText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  submitText: {
    color: palette.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
});

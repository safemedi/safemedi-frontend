import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { palette } from "@/constants/design-tokens";
import { ActiveMedicationsCard } from "@/features/family/health-detail/components/ActiveMedicationsCard";
import { useFamilyHealthInfoDetailViewModel } from "@/features/family/health-detail/useFamilyHealthInfoDetailViewModel";
import { ClinicalAlertCard } from "@/features/profile/health-detail/components/ClinicalAlertCard";
import { ClinicianNotesCard } from "@/features/profile/health-detail/components/ClinicianNotesCard";
import { HealthInfoActions } from "@/features/profile/health-detail/components/HealthInfoActions";
import { HealthInfoDetailHeader } from "@/features/profile/health-detail/components/HealthInfoDetailHeader";
import { MedicalGuideCard } from "@/features/profile/health-detail/components/MedicalGuideCard";
import { PatientInfoCard } from "@/features/profile/health-detail/components/PatientInfoCard";
import {
  ALLERGY_HEADER_ICON,
  CHRONIC_HEADER_ICON,
  CLINICIAN_NOTE_ITEMS,
  MEDICAL_GUIDE_TEXT,
} from "@/features/profile/health-detail/constants";

export function FamilyHealthInfoDetailScreen() {
  const vm = useFamilyHealthInfoDetailViewModel();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.handleRefresh} />}
    >
      <YStack gap={12}>
        <HealthInfoDetailHeader onBack={vm.handleBack} />
        {vm.errorMessage ? (
          <YStack gap={12}>
            <Text style={styles.message}>{vm.errorMessage}</Text>
            {vm.canRetry ? (
              <Pressable accessibilityRole="button" onPress={vm.handleRefresh}>
                <Text style={styles.retry}>다시 시도</Text>
              </Pressable>
            ) : null}
          </YStack>
        ) : vm.isLoading ? (
          <ActivityIndicator accessibilityLabel="가족 건강정보 불러오는 중" color={palette.green} />
        ) : vm.patient ? (
          <YStack gap={12}>
            <MedicalGuideCard description={MEDICAL_GUIDE_TEXT} />
            <PatientInfoCard patient={vm.patient} />
            {vm.allergySection ? (
              <ClinicalAlertCard section={vm.allergySection} iconName={ALLERGY_HEADER_ICON} />
            ) : null}
            {vm.diseaseSection ? (
              <ClinicalAlertCard section={vm.diseaseSection} iconName={CHRONIC_HEADER_ICON} />
            ) : null}
            <ActiveMedicationsCard prescriptions={vm.prescriptions} />
            <ClinicianNotesCard notes={CLINICIAN_NOTE_ITEMS} />
            <HealthInfoActions />
          </YStack>
        ) : null}
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 14 },
  message: { color: palette.black },
  retry: { color: palette.green_deep },
});

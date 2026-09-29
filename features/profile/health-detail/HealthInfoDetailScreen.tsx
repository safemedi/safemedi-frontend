import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PillButton } from "@/components/ui/PillButton";
import { palette } from "@/constants/design-tokens";
import { useScreenBottomPadding } from "@/hooks/useScreenBottomPadding";
import { useHealthInfo, useUserStore } from "@/stores/userStore";
import { splitBloodTypeWithRh } from "@/utils/blood-type";
import { ClinicalAlertCard } from "./components/ClinicalAlertCard";
import { ClinicianNotesCard } from "./components/ClinicianNotesCard";
import { HealthInfoDetailHeader } from "./components/HealthInfoDetailHeader";
import { MedicalGuideCard } from "./components/MedicalGuideCard";
import { PatientInfoCard } from "./components/PatientInfoCard";
import {
  ALLERGY_BADGE_LABEL,
  ALLERGY_HEADER_ICON,
  ALLERGY_ITEM_DESCRIPTION,
  CHRONIC_BADGE_LABEL,
  CHRONIC_HEADER_ICON,
  CHRONIC_ITEM_DESCRIPTION,
  CLINICIAN_NOTE_ITEMS,
  createIndexedAlertItems,
  EMPTY_BADGE_LABEL,
  EMPTY_ITEM_TEXT,
  MEDICAL_GUIDE_TEXT,
  PRINT_SUCCESS_MESSAGE,
  SHARE_SUCCESS_MESSAGE,
} from "./constants";
import type { ClinicalAlertSection, PatientInfo } from "./types";

const UNKNOWN_VALUE = "-";
const EMPTY_SECTION_TEXT = "등록된 건강 정보가 없습니다";
const BG_PINK_LINE_STOPS = [0, 0.5, 1] as const;

function formatBirthDate(rawBirthDate: string | null): string {
  if (!rawBirthDate) return UNKNOWN_VALUE;
  return rawBirthDate.replaceAll("-", ".");
}

function formatGender(rawGender: "male" | "female" | null): string {
  if (rawGender === "male") return "남성";
  if (rawGender === "female") return "여성";
  return UNKNOWN_VALUE;
}

function formatHeight(rawHeight: number | null): string {
  if (rawHeight == null) return UNKNOWN_VALUE;
  return `${rawHeight} cm`;
}

function formatWeight(rawWeight: number | null): string {
  if (rawWeight == null) return UNKNOWN_VALUE;
  return `${rawWeight} kg`;
}

function formatBloodType(rawBloodType: string | null): string {
  if (!rawBloodType) return UNKNOWN_VALUE;
  const { bloodType, rhFactor } = splitBloodTypeWithRh(rawBloodType);
  if (!bloodType) return UNKNOWN_VALUE;
  if (!rhFactor) return bloodType;
  const rhSign = rhFactor === "positive" ? "+" : "-";
  return `${bloodType} (Rh${rhSign})`;
}

function createPatientInfo(
  displayName: string | null,
  birthDate: string | null,
  gender: "male" | "female" | null,
  height: number | null,
  weight: number | null,
  bloodType: string | null,
): PatientInfo {
  return {
    name: displayName ?? UNKNOWN_VALUE,
    birthDate: formatBirthDate(birthDate),
    gender: formatGender(gender),
    height: formatHeight(height),
    weight: formatWeight(weight),
    bloodType: formatBloodType(bloodType),
  };
}

function createAlertSection(
  title: string,
  subtitle: string,
  items: readonly string[],
  description: string,
  badgeLabel: string,
  tone: ClinicalAlertSection["tone"],
): ClinicalAlertSection {
  const normalizedItems = items.length > 0 ? items : [EMPTY_SECTION_TEXT];
  const resolvedDescription = items.length > 0 ? description : EMPTY_ITEM_TEXT;
  const resolvedBadgeLabel = items.length > 0 ? badgeLabel : EMPTY_BADGE_LABEL;

  return {
    title,
    subtitle,
    tone,
    items: createIndexedAlertItems(normalizedItems, resolvedDescription, resolvedBadgeLabel),
  };
}

export function HealthInfoDetailScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useScreenBottomPadding(24);
  const user = useUserStore((state) => state.user);
  const data = useHealthInfo();
  const allergies = data.allergies ?? [];
  const chronicConditions = data.chronicConditions ?? [];

  const patientInfo = useMemo(
    () =>
      createPatientInfo(
        user?.displayName ?? null,
        user?.birthDate ?? null,
        user?.gender ?? null,
        user?.height ?? null,
        user?.weight ?? null,
        user?.bloodType ?? null,
      ),
    [user?.birthDate, user?.bloodType, user?.displayName, user?.gender, user?.height, user?.weight],
  );

  const allergySection = useMemo(
    () =>
      createAlertSection(
        "약물 알러지",
        "처방 전 반드시 확인 필요",
        allergies,
        ALLERGY_ITEM_DESCRIPTION,
        ALLERGY_BADGE_LABEL,
        "danger",
      ),
    [allergies],
  );

  const chronicSection = useMemo(
    () =>
      createAlertSection(
        "기저질환",
        "약물 대사 고려 필요",
        chronicConditions,
        CHRONIC_ITEM_DESCRIPTION,
        CHRONIC_BADGE_LABEL,
        "info",
      ),
    [chronicConditions],
  );

  const handlePrint = useCallback(() => {
    Alert.alert("인쇄하기", PRINT_SUCCESS_MESSAGE);
  }, []);

  const handleShare = useCallback(() => {
    Alert.alert("공유하기", SHARE_SUCCESS_MESSAGE);
  }, []);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[...palette.bg_pink_line]}
        locations={[...BG_PINK_LINE_STOPS]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 14, paddingBottom: bottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <HealthInfoDetailHeader onBack={() => router.back()} />
          <MedicalGuideCard description={MEDICAL_GUIDE_TEXT} />
          <PatientInfoCard patient={patientInfo} />
          <ClinicalAlertCard section={allergySection} iconName={ALLERGY_HEADER_ICON} />
          <ClinicalAlertCard section={chronicSection} iconName={CHRONIC_HEADER_ICON} />
          <ClinicianNotesCard notes={CLINICIAN_NOTE_ITEMS} />
          <View style={styles.actionRow}>
            <PillButton
              variant="outline"
              onPress={handlePrint}
              borderColor={palette.green_soft}
              backgroundColor="transparent"
              leftElement={<Ionicons name="print-outline" size={14} color={palette.green_deep} />}
              accessibilityLabel="건강 정보 인쇄하기"
            >
              <Text style={styles.outlineActionText}>인쇄하기</Text>
            </PillButton>
            <PillButton
              variant="solid"
              onPress={handleShare}
              backgroundColor={palette.green}
              leftElement={<Ionicons name="share-social-outline" size={14} color={palette.white} />}
              accessibilityLabel="건강 정보 공유하기"
            >
              <Text style={styles.solidActionText}>공유하기</Text>
            </PillButton>
          </View>
        </View>
      </ScrollView>
    </View>
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
  },
  container: {
    gap: 12,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  outlineActionText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: palette.green_deep,
  },
  solidActionText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: palette.white,
  },
});

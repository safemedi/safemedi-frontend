import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

import type { PatientInfo } from "../types";

export interface PatientInfoCardProps {
  readonly patient: PatientInfo;
}

interface InfoRowProps {
  readonly label: string;
  readonly value: string;
  readonly hasDivider?: boolean;
}

function InfoRow({ label, value, hasDivider = true }: InfoRowProps) {
  return (
    <View style={[styles.row, hasDivider && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function PatientInfoCard({ patient }: PatientInfoCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="document-text-outline" size={17} color={palette.green} />
        <Text style={styles.headerText}>환자 기본 정보</Text>
      </View>
      <InfoRow label="이름" value={patient.name} />
      <InfoRow label="생년월일" value={patient.birthDate} />
      <InfoRow label="성별" value={patient.gender} />
      <InfoRow label="신장" value={patient.height} />
      <InfoRow label="몸무게" value={patient.weight} />
      <InfoRow label="혈액형" value={patient.bloodType} hasDivider={false} />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 2,
  },
  headerText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: palette.black,
    letterSpacing: -0.15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    paddingBottom: 10,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: palette.surface_neutral,
  },
  rowLabel: {
    fontSize: 12,
    lineHeight: 17,
    color: palette.icon,
  },
  rowValue: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: palette.black,
  },
});

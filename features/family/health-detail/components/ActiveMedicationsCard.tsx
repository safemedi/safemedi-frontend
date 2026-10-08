import { StyleSheet, Text, View } from "react-native";
import type { MedicalSummaryPrescription } from "@/api/types/medical-summary";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

interface ActiveMedicationsCardProps {
  readonly prescriptions: readonly MedicalSummaryPrescription[];
}

export function ActiveMedicationsCard({ prescriptions }: ActiveMedicationsCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <Text style={styles.heading}>현재 복용 중인 약물</Text>
      {prescriptions.length === 0 ? (
        <Text style={styles.description}>현재 복용 중인 약물이 없습니다.</Text>
      ) : (
        prescriptions.map((prescription) => (
          <View key={prescription.prescriptionId} style={styles.prescription}>
            <Text style={styles.title}>{prescription.prescriptionTitle}</Text>
            <Text style={styles.description}>
              {prescription.startDate} ~ {prescription.endDate}
            </Text>
            <Text style={styles.title}>
              {prescription.medications.map((medication) => medication.drugName).join("\n") ||
                "등록된 약물이 없습니다."}
            </Text>
          </View>
        ))
      )}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 18, gap: 12 },
  prescription: { gap: 6 },
  heading: { fontSize: 14, fontWeight: "700", color: palette.black },
  title: { fontSize: 12, lineHeight: 20, color: palette.black },
  description: { fontSize: 12, color: palette.icon },
});

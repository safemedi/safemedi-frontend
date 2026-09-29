import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import { Badge } from "@/components/ui/Badge";
import { PillButton } from "@/components/ui/PillButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import type { MedicalFacility } from "../types";

export interface MedicalFacilityCardProps {
  readonly facility: MedicalFacility;
  readonly onPressCall: (facility: MedicalFacility) => void;
  readonly onPressDirections: (facility: MedicalFacility) => void;
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1_000) {
    return `${(distanceMeters / 1_000).toFixed(1)}km`;
  }
  return `${distanceMeters}m`;
}

function getCategoryLabel(category: MedicalFacility["category"]): string {
  return category === "pharmacy" ? "약국" : "응급실";
}

function getStatusLabel(status: MedicalFacility["status"]): string {
  if (status === "open") return "영업중";
  if (status === "closed") return "영업종료";
  return "정보없음";
}

function getStatusBadgeStyle(status: MedicalFacility["status"]) {
  if (status === "open") {
    return {
      backgroundColor: palette.risk_safe_badge_bg,
      textColor: palette.risk_safe_badge_text,
    };
  }
  if (status === "closed") {
    return {
      backgroundColor: palette.surface_neutral,
      textColor: palette.black,
    };
  }
  return {
    backgroundColor: palette.blue_soft,
    textColor: palette.blue_deep,
  };
}

export function MedicalFacilityCard({
  facility,
  onPressCall,
  onPressDirections,
}: MedicalFacilityCardProps) {
  const statusBadgeStyle = getStatusBadgeStyle(facility.status);
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{facility.name}</Text>
          {facility.is24Hours ? (
            <Badge
              label="24시"
              backgroundColor={`${palette.purple}22`}
              textColor={palette.purple}
              style={styles.metaBadge}
            />
          ) : null}
        </View>
        <Badge
          label={getStatusLabel(facility.status)}
          backgroundColor={statusBadgeStyle.backgroundColor}
          textColor={statusBadgeStyle.textColor}
          style={styles.metaBadge}
        />
      </View>

      <View style={styles.subRow}>
        <Badge
          label={getCategoryLabel(facility.category)}
          backgroundColor={facility.category === "pharmacy" ? palette.green : palette.red_medium}
          textColor={palette.white}
          style={styles.metaBadge}
        />
        <Text style={styles.distance}>{formatDistance(facility.distanceMeters)}</Text>
      </View>

      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={14} color={palette.icon} />
        <Text style={styles.addressText} numberOfLines={1}>
          {facility.roadAddress || facility.address}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <PillButton
          variant="outline"
          onPress={() => onPressCall(facility)}
          leftElement={<Ionicons name="call-outline" size={14} color={palette.title_emphasis} />}
          accessibilityLabel={`${facility.name} 전화`}
        >
          <Text style={styles.callText}>전화</Text>
        </PillButton>
        <PillButton
          variant="solid"
          onPress={() => onPressDirections(facility)}
          leftElement={<Ionicons name="navigate-outline" size={14} color={palette.white} />}
          backgroundColor={palette.green}
          accessibilityLabel={`${facility.name} 길찾기`}
        >
          <Text style={styles.directionsText}>길찾기</Text>
        </PillButton>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderColor: palette.map_facility_border, borderWidth: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, paddingRight: 8 },
  title: { fontSize: 16, fontWeight: "700", color: palette.title_emphasis, flexShrink: 1 },
  subRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  metaBadge: { paddingHorizontal: 9, paddingVertical: 3 },
  distance: { fontSize: 14, color: palette.icon },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  addressText: { flex: 1, fontSize: 14, color: palette.icon },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  callText: { color: palette.title_emphasis, fontWeight: "600", fontSize: 14 },
  directionsText: { color: palette.white, fontWeight: "600", fontSize: 14 },
});

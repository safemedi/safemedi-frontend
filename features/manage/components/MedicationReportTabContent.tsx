import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout } from "@/constants/design-tokens";

export interface MedicationReportTabProps {
  readonly header?: ReactNode;
}

interface MedicationReportTabContentProps extends MedicationReportTabProps {
  readonly children: ReactNode;
}

export function MedicationReportTabContent({ children, header }: MedicationReportTabContentProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
    >
      {header}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 14, gap: 14, paddingBottom: layout.tabScreenBottomSpacing },
});

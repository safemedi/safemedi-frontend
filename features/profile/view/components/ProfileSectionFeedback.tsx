import { Pressable, StyleSheet, Text, View } from "react-native";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

interface ProfileSectionFeedbackProps {
  readonly title: string;
  readonly isLoading: boolean;
  readonly onRetry: () => void;
}

export function ProfileSectionFeedback({ title, isLoading, onRetry }: ProfileSectionFeedbackProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <SurfaceCard style={styles.card}>
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {isLoading
            ? `${title} 정보를 다시 불러오는 중입니다.`
            : `${title} 정보를 불러오지 못했습니다.`}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 정보 다시 시도`}
          disabled={isLoading}
          onPress={onRetry}
        >
          <Text style={styles.retry}>{isLoading ? "재시도 중" : "다시 시도"}</Text>
        </Pressable>
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  title: { fontSize: 14, fontWeight: "600", color: palette.black },
  card: { padding: 16, gap: 12 },
  message: { color: palette.icon },
  retry: { color: palette.green_deep, fontWeight: "600" },
});

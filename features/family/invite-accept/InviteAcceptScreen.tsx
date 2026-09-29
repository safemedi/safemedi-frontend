import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";

import { getHttpStatus } from "@/api/error";
import { useAcceptFamilyInvitation, useFamilyInvitation } from "@/api/queries/family";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PillButton } from "@/components/ui/PillButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

interface InviteAcceptScreenProps {
  readonly token: string | null;
}

const NOOP = (): void => {};

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
} as const;

function getInviteErrorMessage(error: unknown): string {
  switch (getHttpStatus(error)) {
    case HTTP_STATUS.NOT_FOUND:
      return "존재하지 않거나 유효하지 않은 초대 링크입니다.";
    case HTTP_STATUS.GONE:
      return "만료된 초대 링크입니다.";
    case HTTP_STATUS.CONFLICT:
      return "이미 처리되었거나 확인할 수 없는 초대 링크입니다.";
    case HTTP_STATUS.BAD_REQUEST:
      return "본인이 생성한 초대 링크는 사용할 수 없습니다.";
    case HTTP_STATUS.UNAUTHORIZED:
      return "로그인이 만료되었습니다. 다시 로그인해주세요.";
    default:
      return "초대 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
  }
}

function formatExpiresAt(value?: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function InviteAcceptScreen({ token }: InviteAcceptScreenProps) {
  const insets = useSafeAreaInsets();
  const invitationQuery = useFamilyInvitation(token);
  const acceptInvitationMutation = useAcceptFamilyInvitation();

  const handleGoToDashboard = () => {
    router.replace("/(tabs)/dashboard");
  };

  const handleAccept = () => {
    if (!token) return;
    acceptInvitationMutation.mutate(token, {
      onSuccess: () => {
        Alert.alert("수락 완료", "가족 초대를 수락했어요.");
        router.replace("/(detail)/family/manage");
      },
      onError: () => {
        Alert.alert("수락 실패", "초대 수락에 실패했습니다. 잠시 후 다시 시도해주세요.");
      },
    });
  };

  const handleReject = () => {
    Alert.alert("초대 거절", "이 초대를 거절하시겠어요?", [
      { text: "취소", style: "cancel" },
      { text: "거절", style: "destructive", onPress: handleGoToDashboard },
    ]);
  };

  const isMissingToken = !token;
  const isLoading = !isMissingToken && invitationQuery.isLoading;
  const isError = isMissingToken || invitationQuery.isError;
  const isAccepting = acceptInvitationMutation.isPending;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...palette.bg_family_manage]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <SurfaceCard style={styles.card}>
          {isLoading ? (
            <YStack items="center" gap={12} style={styles.feedback}>
              <LoadingSpinner accessibilityLabel="초대 정보 확인 중" />
              <Text style={styles.feedbackText}>초대 정보를 확인하는 중입니다.</Text>
            </YStack>
          ) : null}

          {!isLoading && isError ? (
            <YStack items="center" gap={14} style={styles.feedback}>
              <Ionicons name="alert-circle-outline" size={36} color={palette.red_strong} />
              <Text style={styles.feedbackText}>
                {isMissingToken
                  ? "잘못된 초대 링크입니다."
                  : getInviteErrorMessage(invitationQuery.error)}
              </Text>
              <PillButton
                variant="solid"
                onPress={handleGoToDashboard}
                accessibilityLabel="홈으로 이동"
                backgroundColor={palette.green}
                flex={0}
              >
                <Text style={styles.acceptLabel}>홈으로 이동</Text>
              </PillButton>
            </YStack>
          ) : null}

          {!isLoading && !isError ? (
            <YStack items="center" gap={18}>
              <LinearGradient
                colors={[...palette.bg_invite_icon]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconWrap}
              >
                <Ionicons name="people" size={36} color={palette.white} />
              </LinearGradient>

              <YStack items="center" gap={6}>
                <Text style={styles.title}>
                  {invitationQuery.data?.inviterName ?? "가족"}님이{"\n"}가족으로 초대했어요
                </Text>
                {invitationQuery.data?.expiresAt ? (
                  <Text style={styles.description}>
                    {formatExpiresAt(invitationQuery.data.expiresAt)}까지 수락할 수 있어요
                  </Text>
                ) : null}
              </YStack>

              <XStack gap={10} width="100%">
                <PillButton
                  variant="outline"
                  disabled={isAccepting}
                  onPress={isAccepting ? NOOP : handleReject}
                  accessibilityLabel="가족 초대 거절"
                  borderColor={palette.dark_gray}
                  backgroundColor={palette.white}
                >
                  <Text style={styles.rejectLabel}>거절하기</Text>
                </PillButton>
                <PillButton
                  variant="solid"
                  disabled={isAccepting}
                  onPress={isAccepting ? NOOP : handleAccept}
                  accessibilityLabel="가족 초대 수락"
                  backgroundColor={palette.green}
                >
                  <Text style={styles.acceptLabel}>{isAccepting ? "수락 중" : "수락하기"}</Text>
                </PillButton>
              </XStack>
            </YStack>
          ) : null}
        </SurfaceCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  feedback: {
    paddingVertical: 12,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: "500",
    color: palette.black,
    textAlign: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.black,
    textAlign: "center",
    lineHeight: 24,
    letterSpacing: -0.15,
  },
  description: {
    fontSize: 13,
    color: palette.icon,
    lineHeight: 18,
  },
  acceptLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.white,
  },
  rejectLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.black,
  },
});

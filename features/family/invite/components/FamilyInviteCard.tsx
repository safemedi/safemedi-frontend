import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet } from "react-native";
import { Text, XStack, YStack } from "tamagui";

import { PillButton } from "@/components/ui/PillButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

type FamilyInviteCardProps = {
  inviteLink: string;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCopyLink?: () => void;
  onShareLink?: () => void;
};

const NOOP = (): void => {};

export function FamilyInviteCard({
  inviteLink,
  isLoading = false,
  isError = false,
  onRetry,
  onCopyLink,
  onShareLink,
}: FamilyInviteCardProps) {
  const hasInviteLink = inviteLink.trim().length > 0;
  const linkText = isLoading
    ? "초대 링크 생성 중"
    : isError
      ? "초대 링크를 생성하지 못했습니다"
      : inviteLink;

  return (
    <YStack gap={10}>
      <SectionHeader
        icon={<Ionicons name="person-add-outline" size={16} color={palette.green} />}
        title="가족 초대하기"
      />
      <SurfaceCard style={styles.card}>
        <YStack items="center" gap={14}>
          <LinearGradient
            colors={[...palette.bg_invite_icon]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconWrap}
          >
            <Ionicons name="link-outline" size={28} color={palette.white} />
          </LinearGradient>
          <YStack items="center" gap={4}>
            <Text style={styles.title}>초대 링크 공유</Text>
            <Text style={styles.description}>아래 링크를 가족에게 공유하세요</Text>
          </YStack>
        </YStack>

        <XStack style={styles.linkBox} items="center" justify="space-between" gap={8}>
          <Text style={styles.link} numberOfLines={1}>
            {linkText}
          </Text>
          <Pressable onPress={onCopyLink} hitSlop={8} style={styles.copyButton}>
            <Ionicons name="copy-outline" size={16} color={palette.black} />
          </Pressable>
        </XStack>

        <XStack gap={8}>
          {isError ? (
            <PillButton
              variant="outline"
              onPress={onRetry ?? NOOP}
              borderColor={palette.green_soft}
              backgroundColor={palette.gray}
              leftElement={<Ionicons name="refresh-outline" size={14} color={palette.green_deep} />}
            >
              <Text style={styles.outlineButtonLabel}>다시 생성</Text>
            </PillButton>
          ) : (
            <PillButton
              variant="outline"
              disabled={!hasInviteLink}
              onPress={hasInviteLink ? (onCopyLink ?? NOOP) : NOOP}
              borderColor={palette.green_soft}
              backgroundColor={palette.gray}
              leftElement={<Ionicons name="copy-outline" size={14} color={palette.green_deep} />}
            >
              <Text style={styles.outlineButtonLabel}>링크 복사</Text>
            </PillButton>
          )}
          <PillButton
            variant="solid"
            disabled={!hasInviteLink}
            onPress={hasInviteLink ? (onShareLink ?? NOOP) : NOOP}
            backgroundColor={palette.green}
            leftElement={<Ionicons name="share-social-outline" size={14} color={palette.white} />}
          >
            <Text style={styles.filledButtonLabel}>공유하기</Text>
          </PillButton>
        </XStack>
      </SurfaceCard>
    </YStack>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    gap: 18,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconWrap: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    color: palette.black,
    letterSpacing: -0.15,
  },
  description: {
    fontSize: 12,
    color: palette.icon,
    lineHeight: 17,
  },
  linkBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.dark_gray,
    backgroundColor: palette.surface_subtle,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  link: {
    flex: 1,
    fontSize: 12,
    color: palette.black,
  },
  copyButton: {
    width: 30,
    height: 30,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.dark_gray,
    backgroundColor: palette.white,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: palette.green_deep,
  },
  filledButtonLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: palette.white,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, TextInput } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import type { FamilySummary } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { PillButton } from "@/components/ui/PillButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";

type FamilyMemberCardProps = {
  member: FamilySummary;
  isEditing: boolean;
  relationDraft: string;
  canSaveRelation: boolean;
  isSavingRelation: boolean;
  isUnlinking: boolean;
  onChangeRelationDraft: (text: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveRelation: () => void;
  onUnlink: () => void;
};

export function FamilyMemberCard({
  member,
  isEditing,
  relationDraft,
  canSaveRelation,
  isSavingRelation,
  isUnlinking,
  onChangeRelationDraft,
  onStartEdit,
  onCancelEdit,
  onSaveRelation,
  onUnlink,
}: FamilyMemberCardProps) {
  const isMe = member.familyId === null;

  return (
    <SurfaceCard style={styles.card}>
      <YStack gap={10}>
        <XStack items="center" justify="space-between" gap={12}>
          <XStack items="center" gap={10} flex={1}>
            <LinearGradient
              colors={[...palette.bg_invite_icon]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarEmoji}>{isMe ? "나" : member.relation.slice(0, 1)}</Text>
            </LinearGradient>
            <YStack gap={2} flex={1}>
              <XStack items="center" gap={4}>
                <Text style={styles.name}>{member.name}</Text>
                <Ionicons name="checkmark-circle-outline" size={14} color={palette.green} />
              </XStack>
              <Text style={styles.relation}>{member.relation}</Text>
            </YStack>
          </XStack>
          {isMe ? (
            <Badge label="본인" backgroundColor={palette.green} textColor={palette.white} />
          ) : null}
        </XStack>

        {!isMe && isEditing ? (
          <YStack gap={6}>
            <TextInput
              value={relationDraft}
              onChangeText={onChangeRelationDraft}
              maxLength={20}
              placeholder="호칭을 입력하세요"
              placeholderTextColor={palette.input_placeholder}
              accessibilityLabel={`${member.name} 호칭 입력`}
              style={styles.input}
            />
            <XStack gap={6}>
              <PillButton
                variant="outline"
                size="sm"
                onPress={onCancelEdit}
                accessibilityLabel={`${member.name} 호칭 수정 취소`}
                borderColor={palette.dark_gray}
                backgroundColor={palette.white}
              >
                <Text style={styles.outlineLabel}>취소</Text>
              </PillButton>
              <PillButton
                variant="solid"
                size="sm"
                disabled={!canSaveRelation || isSavingRelation}
                onPress={onSaveRelation}
                accessibilityLabel={`${member.name} 호칭 저장`}
                backgroundColor={palette.green}
              >
                <Text style={styles.solidLabel}>{isSavingRelation ? "저장 중" : "저장"}</Text>
              </PillButton>
            </XStack>
          </YStack>
        ) : null}

        {!isMe && !isEditing ? (
          <XStack gap={6}>
            <PillButton
              variant="outline"
              size="sm"
              disabled={isUnlinking}
              onPress={onStartEdit}
              accessibilityLabel={`${member.name} 호칭 수정`}
              borderColor={palette.dark_gray}
              backgroundColor={palette.white}
            >
              <Text style={styles.outlineLabel}>호칭 수정</Text>
            </PillButton>
            <PillButton
              variant="outline"
              size="sm"
              disabled={isUnlinking}
              onPress={onUnlink}
              accessibilityLabel={`${member.name} 가족 연동 해제`}
              borderColor={palette.red_outline}
              backgroundColor={palette.white}
            >
              <Text style={styles.destructiveLabel}>{isUnlinking ? "해제 중" : "연동 해제"}</Text>
            </PillButton>
          </XStack>
        ) : null}
      </YStack>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: palette.shadow_base,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 21,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.black,
    letterSpacing: -0.15,
  },
  relation: {
    fontSize: 12,
    color: palette.icon,
    lineHeight: 17,
  },
  input: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.dark_gray,
    backgroundColor: palette.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: palette.black,
    fontSize: 13,
  },
  outlineLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.black,
  },
  solidLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: palette.white,
  },
  destructiveLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.red_strong,
  },
});

import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet } from "react-native";
import { YStack } from "tamagui";
import type { FamilySummary } from "@/api/types";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { palette } from "@/constants/design-tokens";
import { FamilyMemberCard } from "./FamilyMemberCard";

type FamilyMembersSectionProps = {
  members: readonly FamilySummary[];
  editingFamilyId: number | null;
  relationDraft: string;
  isSavingRelation: boolean;
  unlinkingFamilyId: number | null;
  onChangeRelationDraft: (text: string) => void;
  onStartEdit: (familyId: number) => void;
  onCancelEdit: () => void;
  onSaveRelation: () => void;
  onUnlink: (familyId: number) => void;
};

export function FamilyMembersSection({
  members,
  editingFamilyId,
  relationDraft,
  isSavingRelation,
  unlinkingFamilyId,
  onChangeRelationDraft,
  onStartEdit,
  onCancelEdit,
  onSaveRelation,
  onUnlink,
}: FamilyMembersSectionProps) {
  const getMemberKey = (member: FamilySummary) =>
    member.familyId === null ? "self" : `family-${member.familyId}`;

  return (
    <YStack gap={8}>
      <SectionHeader
        icon={<Ionicons name="people-outline" size={16} color={palette.green} />}
        title="현재 가족 구성원"
        action={
          <Badge
            label={`${members.length}명`}
            backgroundColor={palette.light_green}
            textColor={palette.green_deep}
            textStyle={styles.countBadgeText}
          />
        }
      />
      <YStack gap={8}>
        {members.map((member) => {
          const isEditing = member.familyId !== null && member.familyId === editingFamilyId;
          const trimmedDraft = relationDraft.trim();
          const canSaveRelation =
            isEditing &&
            trimmedDraft.length > 0 &&
            trimmedDraft.length <= 20 &&
            trimmedDraft !== member.relation;

          return (
            <FamilyMemberCard
              key={getMemberKey(member)}
              member={member}
              isEditing={isEditing}
              relationDraft={isEditing ? relationDraft : member.relation}
              canSaveRelation={canSaveRelation}
              isSavingRelation={isEditing && isSavingRelation}
              isUnlinking={member.familyId !== null && member.familyId === unlinkingFamilyId}
              onChangeRelationDraft={onChangeRelationDraft}
              onStartEdit={() => member.familyId !== null && onStartEdit(member.familyId)}
              onCancelEdit={onCancelEdit}
              onSaveRelation={onSaveRelation}
              onUnlink={() => member.familyId !== null && onUnlink(member.familyId)}
            />
          );
        })}
      </YStack>
    </YStack>
  );
}

const styles = StyleSheet.create({
  countBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
});

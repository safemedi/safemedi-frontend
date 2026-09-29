import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import { getApiErrorMessage } from "@/api/error";
import {
  useCreateFamilyInvitation,
  useDeleteFamily,
  useFamilies,
  useUpdateFamilyRelation,
} from "@/api/queries/family";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { palette } from "@/constants/design-tokens";
import { useScreenBottomPadding } from "@/hooks/useScreenBottomPadding";
import { FamilyFeatureBanner } from "./components/FamilyFeatureBanner";
import { FamilyInviteCard } from "./components/FamilyInviteCard";
import { FamilyManageHeader } from "./components/FamilyManageHeader";
import { FamilyMembersSection } from "./components/FamilyMembersSection";

export function FamilyManageScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useScreenBottomPadding(30);
  const familiesQuery = useFamilies();
  const createInvitationMutation = useCreateFamilyInvitation();
  const updateRelationMutation = useUpdateFamilyRelation();
  const deleteFamilyMutation = useDeleteFamily();
  const inviteLink = createInvitationMutation.data?.inviteUrl ?? "";
  const members = familiesQuery.data ?? [];

  const [editingFamilyId, setEditingFamilyId] = useState<number | null>(null);
  const [relationDraft, setRelationDraft] = useState("");

  useEffect(() => {
    if (createInvitationMutation.isIdle) {
      createInvitationMutation.mutate();
    }
  }, [createInvitationMutation]);

  const handleCopyLink = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await Clipboard.setStringAsync(inviteLink);
      Alert.alert("복사 완료", "초대 링크를 클립보드에 복사했어요.");
    } catch {
      Alert.alert("복사 실패", "링크 복사에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }, [inviteLink]);

  const handleShareLink = useCallback(async () => {
    if (!inviteLink) return;
    try {
      await Share.share({ message: inviteLink, url: inviteLink });
    } catch {
      Alert.alert("공유 실패", "링크 공유에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }, [inviteLink]);

  const handleStartEdit = useCallback(
    (familyId: number) => {
      const target = members.find((member) => member.familyId === familyId);
      setEditingFamilyId(familyId);
      setRelationDraft(target?.relation ?? "");
    },
    [members],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingFamilyId(null);
    setRelationDraft("");
  }, []);

  const handleSaveRelation = useCallback(() => {
    if (editingFamilyId === null) return;
    const trimmedRelation = relationDraft.trim();

    updateRelationMutation.mutate(
      { familyId: editingFamilyId, body: { relation: trimmedRelation } },
      {
        onSuccess: () => {
          Alert.alert("호칭 수정 완료", "가족 호칭을 수정했어요.");
          setEditingFamilyId(null);
          setRelationDraft("");
        },
        onError: async (error) => {
          const message = await getApiErrorMessage(
            error,
            "가족 호칭 수정에 실패했습니다. 잠시 후 다시 시도해주세요.",
          );
          Alert.alert("호칭 수정 실패", message);
        },
      },
    );
  }, [editingFamilyId, relationDraft, updateRelationMutation]);

  const handleUnlink = useCallback(
    (familyId: number) => {
      Alert.alert("가족 연동 해제", "이 가족과의 연동을 해제하시겠습니까?", [
        { text: "취소", style: "cancel" },
        {
          text: "해제",
          style: "destructive",
          onPress: () => {
            deleteFamilyMutation.mutate(familyId, {
              onSuccess: () => {
                Alert.alert("연동 해제 완료", "가족 연동을 해제했어요.");
                setEditingFamilyId((current) => (current === familyId ? null : current));
              },
              onError: async (error) => {
                const message = await getApiErrorMessage(
                  error,
                  "가족 연동 해제에 실패했습니다. 잠시 후 다시 시도해주세요.",
                );
                Alert.alert("연동 해제 실패", message);
              },
            });
          },
        },
      ]);
    },
    [deleteFamilyMutation],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[...palette.bg_family_manage]}
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
        <YStack gap={14}>
          <FamilyManageHeader onBack={() => router.back()} />
          {familiesQuery.isLoading ? (
            <View style={styles.feedbackContainer}>
              <LoadingSpinner accessibilityLabel="가족 정보 로딩 중" />
              <Text style={styles.feedbackText}>가족 정보를 불러오는 중입니다.</Text>
            </View>
          ) : null}

          {familiesQuery.isError ? (
            <YStack items="center" gap={12} style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>가족 정보를 불러오지 못했습니다.</Text>
              <Pressable
                onPress={() => familiesQuery.refetch()}
                accessibilityRole="button"
                accessibilityLabel="가족 정보 다시 시도"
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>다시 시도</Text>
              </Pressable>
            </YStack>
          ) : null}

          {!familiesQuery.isLoading && !familiesQuery.isError ? (
            <>
              <FamilyFeatureBanner />
              <FamilyInviteCard
                inviteLink={inviteLink}
                isLoading={createInvitationMutation.isPending || createInvitationMutation.isIdle}
                isError={createInvitationMutation.isError}
                onRetry={() => createInvitationMutation.mutate()}
                onCopyLink={handleCopyLink}
                onShareLink={handleShareLink}
              />
              <FamilyMembersSection
                members={members}
                editingFamilyId={editingFamilyId}
                relationDraft={relationDraft}
                isSavingRelation={updateRelationMutation.isPending}
                unlinkingFamilyId={
                  deleteFamilyMutation.isPending ? (deleteFamilyMutation.variables ?? null) : null
                }
                onChangeRelationDraft={setRelationDraft}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSaveRelation={handleSaveRelation}
                onUnlink={handleUnlink}
              />
            </>
          ) : null}
        </YStack>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  feedbackContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 10,
  },
  feedbackText: {
    color: palette.black,
    fontSize: 14,
    fontWeight: "500",
  },
  retryText: {
    color: palette.green_deep,
    fontSize: 14,
    fontWeight: "700",
  },
  retryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.green_soft,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});

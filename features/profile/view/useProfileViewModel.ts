import Constants from "expo-constants";
import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import { Alert, Linking } from "react-native";

import { getApiErrorMessage } from "@/api/error";
import { useFamilyProfiles } from "@/api/queries/profile";
import { useDeleteUserAccountMutation } from "@/api/queries/user";
import { useLogout } from "@/hooks/useLogout";
import { useHealthInfo, useProfileUser } from "@/stores/userStore";
import type { FamilyProfile } from "./components/FamilyProfileSection";
import { FAMILY_AVATAR_GRADIENTS } from "./constants";

const APP_VERSION = `v${Constants.expoConfig?.version ?? "0.0.0"}`;
const TERMS_URL = "https://jet-captain-13f.notion.site/3b93b2c548ec80aa8ec5e1e4db2e2029";
const PRIVACY_POLICY_URL = "https://jet-captain-13f.notion.site/3a23b2c548ec8094a804c90c59d14e29";
const WITHDRAW_CONFIRM_MESSAGE =
  "탈퇴 시 계정과 연관된 모든 데이터가 삭제되며 복구할 수 없습니다. 정말 탈퇴하시겠습니까?";
const AVATAR_GRADIENT_POOL = [
  FAMILY_AVATAR_GRADIENTS.purple,
  FAMILY_AVATAR_GRADIENTS.green,
] as const;

export function useProfileViewModel() {
  const handleLogout = useLogout();
  const deleteUserAccountMutation = useDeleteUserAccountMutation({
    onSuccess: handleLogout,
  });

  const profileUser = useProfileUser();
  const { data: familySummaries = [] } = useFamilyProfiles();
  const { allergies, chronicConditions } = useHealthInfo();

  const familyProfiles = useMemo<FamilyProfile[]>(() => {
    const members = familySummaries.map((family, index) => ({
      id: family.familyId === null ? "me" : String(family.familyId),
      name: family.name,
      relation: family.relation,
      isActive: family.familyId === null,
      avatarGradient: AVATAR_GRADIENT_POOL[index % AVATAR_GRADIENT_POOL.length],
    }));

    if (members.length > 0) {
      return members;
    }

    return [
      {
        id: "me",
        name: profileUser.name,
        relation: "본인",
        isActive: true,
        avatarGradient: FAMILY_AVATAR_GRADIENTS.green,
      },
    ];
  }, [familySummaries, profileUser.name]);

  const handleOpenProfileEdit = () => {
    router.push("/profile/edit");
  };

  const handleOpenFamilyManage = () => {
    router.push("/family/manage");
  };

  const handleOpenHealthInfoDetail = () => {
    router.push("/profile/health-info");
  };

  const handleOpenTerms = useCallback(async () => {
    try {
      await Linking.openURL(TERMS_URL);
    } catch (error) {
      console.error("Failed to open external URL:", TERMS_URL, error);
    }
  }, []);

  const handleOpenPrivacyPolicy = useCallback(async () => {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch (error) {
      console.error("Failed to open external URL:", PRIVACY_POLICY_URL, error);
    }
  }, []);

  const appInfoItems = useMemo(
    () => [
      { id: "app-info", label: "앱 정보", trailingText: APP_VERSION },
      { id: "terms", label: "이용약관", onPress: handleOpenTerms },
      { id: "privacy-policy", label: "개인정보 처리방침", onPress: handleOpenPrivacyPolicy },
    ],
    [handleOpenTerms, handleOpenPrivacyPolicy],
  );

  const handleWithdrawAccount = useCallback(() => {
    Alert.alert("회원 탈퇴", WITHDRAW_CONFIRM_MESSAGE, [
      { text: "취소", style: "cancel" },
      {
        text: "탈퇴",
        style: "destructive",
        onPress: () => {
          deleteUserAccountMutation.mutate(undefined, {
            onError: async (error) => {
              const message = await getApiErrorMessage(
                error,
                "회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.",
              );
              Alert.alert("탈퇴 실패", message);
            },
          });
        },
      },
    ]);
  }, [deleteUserAccountMutation]);

  return {
    profileUser,
    familyProfiles,
    allergies,
    chronicConditions,
    appInfoItems,
    handleLogout,
    handleWithdrawAccount,
    isWithdrawing: deleteUserAccountMutation.isPending,
    handleOpenProfileEdit,
    handleOpenFamilyManage,
    handleOpenHealthInfoDetail,
  };
}

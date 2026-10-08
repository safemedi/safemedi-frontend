import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { ScreenLoadingView } from "@/components/ui/ScreenLoadingView";

import { layout } from "@/constants/design-tokens";
import { AppInfoSection } from "./components/AppInfoSection";
import { FamilyProfileSection } from "./components/FamilyProfileSection";
import { HealthInfoSection } from "./components/HealthInfoSection";
import { LogoutButton } from "./components/LogoutButton";
import { ProfilePageHeader } from "./components/ProfilePageHeader";
import { SettingsSection } from "./components/SettingsSection";
import { UserHeroCard } from "./components/UserHeroCard";
import { WithdrawAccountButton } from "./components/WithdrawAccountButton";
import { useProfileViewModel } from "./useProfileViewModel";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const viewModel = useProfileViewModel();

  if (viewModel.isLoading) {
    return <ScreenLoadingView accessibilityLabel="프로필 정보 로딩 중" />;
  }
  if (viewModel.isError) {
    return (
      <View style={styles.feedback}>
        <Text>프로필 정보를 불러오지 못했습니다.</Text>
        <Pressable accessibilityRole="button" onPress={viewModel.handleRetry}>
          <Text>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: layout.tabScreenBottomSpacing },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap={20}>
        <ProfilePageHeader />
        <UserHeroCard
          name={viewModel.profileUser.name}
          role={viewModel.profileUser.role}
          onPress={viewModel.handleOpenProfileEdit}
        />
        <FamilyProfileSection
          profiles={viewModel.familyProfiles}
          onSelectFamily={viewModel.handleOpenFamilyMedication}
          onAddFamily={viewModel.handleOpenFamilyManage}
        />
        <HealthInfoSection
          allergies={viewModel.allergies}
          chronicConditions={viewModel.chronicConditions}
          onDetailPress={viewModel.handleOpenHealthInfoDetail}
          onEditAllergies={viewModel.handleOpenProfileEdit}
          onEditChronicConditions={viewModel.handleOpenProfileEdit}
        />
        <SettingsSection />
        <AppInfoSection items={viewModel.appInfoItems} />
        <YStack gap={8}>
          <LogoutButton onPress={viewModel.handleLogout} disabled={viewModel.isWithdrawing} />
          <WithdrawAccountButton
            onPress={viewModel.handleWithdrawAccount}
            disabled={viewModel.isWithdrawing}
            isLoading={viewModel.isWithdrawing}
          />
        </YStack>
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  feedback: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
});

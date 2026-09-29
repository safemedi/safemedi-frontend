import { Controller } from "react-hook-form";
import { ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";

import { useScreenBottomPadding } from "@/hooks/useScreenBottomPadding";
import { ProfileBasicInfoCard } from "./components/ProfileBasicInfoCard";
import { ProfileEditActionBar } from "./components/ProfileEditActionBar";
import { ProfileEditHeader } from "./components/ProfileEditHeader";
import { ProfileEditNoticeCard } from "./components/ProfileEditNoticeCard";
import { ProfileNicknameCard } from "./components/ProfileNicknameCard";
import { ProfileTagEditorCard } from "./components/ProfileTagEditorCard";
import { useProfileEditViewModel } from "./useProfileEditViewModel";

export function ProfileEditScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useScreenBottomPadding(16);
  const viewModel = useProfileEditViewModel();

  return (
    <ScrollView
      style={styles.scroll}
      testID="profile-edit-scroll"
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 14, paddingBottom: bottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap={14}>
        <ProfileEditHeader onBack={viewModel.handleBack} />
        <Controller
          control={viewModel.control}
          name="displayName"
          render={({ field: { value, onChange } }) => (
            <ProfileNicknameCard value={value} onChange={onChange} />
          )}
        />
        <ProfileBasicInfoCard
          gender={viewModel.gender}
          bloodType={viewModel.bloodType}
          rhFactor={viewModel.rhFactor}
          onGenderChange={viewModel.handleGenderChange}
          onBloodTypeChange={viewModel.handleBloodTypeChange}
          onRhFactorChange={viewModel.handleRhFactorChange}
        />
        <ProfileTagEditorCard
          variant="allergy"
          title="알러지"
          items={viewModel.allergies}
          inputValue={viewModel.allergyInput}
          inputPlaceholder="새 알러지 입력"
          onInputChange={viewModel.handleAllergyInputChange}
          onAddItem={viewModel.handleAddAllergy}
          onRemoveItem={viewModel.handleRemoveAllergy}
          inputMode="search"
          searchResults={viewModel.allergySearchResults}
          isSearchEnabled={viewModel.isAllergySearchEnabled}
          isSearchFetching={viewModel.isAllergySearchFetching}
          isSearchFetchingNextPage={viewModel.isAllergySearchFetchingNextPage}
          hasMoreSearchResults={viewModel.hasMoreAllergyResults}
          onSelectSearchResult={viewModel.handleSelectAllergySearchResult}
          onLoadMoreSearchResults={viewModel.handleLoadMoreAllergyResults}
        />
        <ProfileTagEditorCard
          variant="chronic"
          title="기저질환"
          items={viewModel.chronicConditions}
          inputValue={viewModel.chronicInput}
          inputPlaceholder="새 기저질환 입력"
          onInputChange={viewModel.handleChronicInputChange}
          onAddItem={viewModel.handleAddChronicCondition}
          onRemoveItem={viewModel.handleRemoveChronicCondition}
          inputMode="search"
          searchResults={viewModel.chronicSearchResults}
          isSearchEnabled={viewModel.isChronicSearchEnabled}
          isSearchFetching={viewModel.isChronicSearchFetching}
          isSearchFetchingNextPage={viewModel.isChronicSearchFetchingNextPage}
          hasMoreSearchResults={viewModel.hasMoreChronicResults}
          onSelectSearchResult={viewModel.handleSelectChronicSearchResult}
          onLoadMoreSearchResults={viewModel.handleLoadMoreChronicResults}
        />
        <ProfileEditNoticeCard />
        <ProfileEditActionBar
          onCancel={viewModel.handleBack}
          onSubmit={viewModel.handleSubmit}
          isSubmitting={viewModel.isSubmitting}
        />
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
});

import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { type BaseSyntheticEvent, useEffect, useMemo, useState } from "react";
import { type Control, useForm, useWatch } from "react-hook-form";
import { Alert } from "react-native";

import { getApiErrorMessage } from "@/api/error";
import { useUpdateUserProfileMutation } from "@/api/queries/user";
import type { UserProfilePatchAllergyItem } from "@/api/types/user";
import {
  chronicConditionOptions,
  GENDERS,
  type GenderOptionValue,
} from "@/constants/health-profile-options";
import { useDiseaseSearch, useDrugAllergySearch } from "@/hooks/useHealthProfileSearch";
import { useUserStore } from "@/stores/userStore";
import { splitBloodTypeWithRhOrDefault } from "@/utils/blood-type";
import {
  buildUserAllergyEditState,
  chronicConditionLabelsToDiseaseCodes,
  profileAllergyLabelsToPatchItems,
} from "@/utils/user-mapper";
import type { ProfileTagSearchResult } from "./components/ProfileTagEditorCard";
import { type ProfileEditFormValues, profileEditSchema } from "./schema";

export interface ProfileEditViewModel {
  readonly control: Control<ProfileEditFormValues>;
  readonly gender: ProfileEditFormValues["gender"];
  readonly bloodType: ProfileEditFormValues["bloodType"];
  readonly rhFactor: ProfileEditFormValues["rhFactor"];
  readonly allergyInput: string;
  readonly allergies: readonly string[];
  readonly chronicInput: string;
  readonly chronicConditions: readonly string[];
  readonly isSubmitting: boolean;
  readonly handleBack: () => void;
  readonly handleGenderChange: (value: GenderOptionValue) => void;
  readonly handleBloodTypeChange: (value: ProfileEditFormValues["bloodType"]) => void;
  readonly handleRhFactorChange: (value: ProfileEditFormValues["rhFactor"]) => void;
  readonly handleAllergyInputChange: (value: string) => void;
  readonly handleChronicInputChange: (value: string) => void;
  readonly handleAddAllergy: (value: string) => void;
  readonly handleSelectAllergySearchResult: (result: ProfileTagSearchResult) => void;
  readonly handleRemoveAllergy: (value: string) => void;
  readonly handleAddChronicCondition: (value: string) => void;
  readonly handleSelectChronicSearchResult: (result: ProfileTagSearchResult) => void;
  readonly handleRemoveChronicCondition: (value: string) => void;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly allergySearchResults: readonly ProfileTagSearchResult[];
  readonly isAllergySearchEnabled: boolean;
  readonly isAllergySearchFetching: boolean;
  readonly isAllergySearchFetchingNextPage: boolean;
  readonly hasMoreAllergyResults: boolean;
  readonly handleLoadMoreAllergyResults: () => void;
  readonly chronicSearchResults: readonly ProfileTagSearchResult[];
  readonly isChronicSearchEnabled: boolean;
  readonly isChronicSearchFetching: boolean;
  readonly isChronicSearchFetchingNextPage: boolean;
  readonly hasMoreChronicResults: boolean;
  readonly handleLoadMoreChronicResults: () => void;
}

function createUniqueItems(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const item of items) {
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    next.push(normalized);
  }

  return next;
}

function createInitialChronicConditionCodes(
  items: readonly string[],
  mappedCodes: Readonly<Record<string, string>> = {},
): Record<string, string> {
  const next: Record<string, string> = { ...mappedCodes };
  for (const item of items) {
    const option = chronicConditionOptions.find((entry) => entry.label === item);
    if (option) {
      next[item] = option.code;
    }
  }
  return next;
}

export function useProfileEditViewModel(): ProfileEditViewModel {
  const user = useUserStore((s) => s.user);
  const saveMutation = useUpdateUserProfileMutation();
  const { labels: initialAllergies, mappings: initialAllergyMappings } = useMemo(
    () => buildUserAllergyEditState(user?.allergies ?? [], user?.allergyMappings ?? {}),
    [user?.allergies, user?.allergyMappings],
  );
  const [selectedAllergyItems, setSelectedAllergyItems] = useState<
    Record<string, UserProfilePatchAllergyItem>
  >(() => buildUserAllergyEditState(user?.allergies ?? [], user?.allergyMappings ?? {}).mappings);
  const [selectedChronicConditionCodes, setSelectedChronicConditionCodes] = useState<
    Record<string, string>
  >(() =>
    createInitialChronicConditionCodes(
      user?.chronicConditions ?? [],
      user?.chronicConditionMappings ?? {},
    ),
  );
  const initialGender: GenderOptionValue = GENDERS.includes(
    (user?.gender ?? "male") as GenderOptionValue,
  )
    ? ((user?.gender ?? "male") as GenderOptionValue)
    : "male";
  const { bloodType: initialBloodType, rhFactor: initialRhFactor } = splitBloodTypeWithRhOrDefault(
    user?.bloodType,
  );

  const initialName = user?.displayName ?? "";
  const initialChronic = useMemo(
    () => createUniqueItems(user?.chronicConditions ?? []),
    [user?.chronicConditions],
  );

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      displayName: initialName,
      gender: initialGender,
      bloodType: initialBloodType,
      rhFactor: initialRhFactor,
      allergies: initialAllergies,
      chronicConditions: initialChronic,
      allergyInput: "",
      chronicInput: "",
    },
  });
  const { control, reset, setValue, getValues, handleSubmit } = form;
  const gender = useWatch({ control, name: "gender" });
  const bloodType = useWatch({ control, name: "bloodType" });
  const rhFactor = useWatch({ control, name: "rhFactor" });
  const allergyInput = useWatch({ control, name: "allergyInput" });
  const allergies = useWatch({ control, name: "allergies" });
  const chronicInput = useWatch({ control, name: "chronicInput" });
  const chronicConditions = useWatch({ control, name: "chronicConditions" });

  const {
    items: drugAllergySearchResults,
    isFetching: isAllergySearchFetching,
    isFetchingNextPage: isAllergySearchFetchingNextPage,
    hasNextPage: hasMoreAllergyResults,
    isSearchEnabled: isAllergySearchEnabled,
    loadMore: fetchMoreAllergyResults,
  } = useDrugAllergySearch({ keyword: allergyInput, excludeNames: allergies });
  const allergySearchResults = useMemo<ProfileTagSearchResult[]>(
    () =>
      drugAllergySearchResults.map((item) => ({
        id: `${item.allergyType}:${item.allergyValue}:${item.allergyName}`,
        label: item.allergyName,
        meta: item.allergyValue,
        type: item.allergyType,
        value: item.allergyValue,
        name: item.allergyName,
      })),
    [drugAllergySearchResults],
  );
  const {
    items: diseaseSearchResults,
    isFetching: isChronicSearchFetching,
    isFetchingNextPage: isChronicSearchFetchingNextPage,
    hasNextPage: hasMoreChronicResults,
    isSearchEnabled: isChronicSearchEnabled,
    loadMore: fetchMoreChronicResults,
  } = useDiseaseSearch({ keyword: chronicInput, excludeNames: chronicConditions });
  const chronicSearchResults = useMemo<ProfileTagSearchResult[]>(
    () =>
      diseaseSearchResults.map((item) => ({
        id: `${item.diseaseCode}:${item.diseaseName}`,
        label: item.diseaseName,
        meta: item.diseaseCode,
        type: "DISEASE" as const,
        value: item.diseaseCode,
        name: item.diseaseName,
      })),
    [diseaseSearchResults],
  );

  useEffect(() => {
    reset({
      displayName: initialName,
      gender: initialGender,
      bloodType: initialBloodType,
      rhFactor: initialRhFactor,
      allergies: initialAllergies,
      chronicConditions: initialChronic,
      allergyInput: "",
      chronicInput: "",
    });
    setSelectedAllergyItems({ ...initialAllergyMappings });
    setSelectedChronicConditionCodes(
      createInitialChronicConditionCodes(initialChronic, user?.chronicConditionMappings ?? {}),
    );
  }, [
    initialAllergies,
    initialAllergyMappings,
    initialBloodType,
    initialChronic,
    initialGender,
    initialName,
    initialRhFactor,
    reset,
    user?.chronicConditionMappings,
  ]);

  const addItem = (
    value: string,
    listField: "allergies" | "chronicConditions",
    inputField?: "allergyInput" | "chronicInput",
  ) => {
    const normalized = value.trim();
    if (!normalized) return;

    const current = getValues(listField);
    if (!current.includes(normalized)) {
      setValue(listField, [...current, normalized], { shouldDirty: true });
    }
    if (inputField) {
      setValue(inputField, "", { shouldDirty: true });
    }
  };

  const removeItem = (value: string, listField: "allergies" | "chronicConditions") => {
    const current = getValues(listField);
    setValue(
      listField,
      current.filter((item) => item !== value),
      { shouldDirty: true },
    );
  };

  const handleSubmitValid = (values: ProfileEditFormValues) => {
    saveMutation.mutate(
      {
        nickname: values.displayName.trim(),
        gender: values.gender === "female" ? "FEMALE" : "MALE",
        bloodType: values.bloodType,
        rhType: values.rhFactor === "negative" ? "MINUS" : "PLUS",
        diseaseCodes: chronicConditionLabelsToDiseaseCodes(
          values.chronicConditions,
          selectedChronicConditionCodes,
        ),
        allergies: profileAllergyLabelsToPatchItems(values.allergies, selectedAllergyItems),
      },
      {
        onSuccess: () => router.back(),
        onError: async (error) => {
          const message = await getApiErrorMessage(
            error,
            "프로필 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
          );
          Alert.alert("저장 실패", message);
        },
      },
    );
  };

  const onInvalid = () => {
    Alert.alert("입력 확인", "닉네임을 입력해주세요.");
  };

  return {
    control,
    gender,
    bloodType,
    rhFactor,
    allergyInput,
    allergies,
    chronicInput,
    chronicConditions,
    isSubmitting: saveMutation.isPending,
    handleBack: () => router.back(),
    handleGenderChange: (value: GenderOptionValue) =>
      setValue("gender", value, { shouldDirty: true }),
    handleBloodTypeChange: (value: ProfileEditFormValues["bloodType"]) =>
      setValue("bloodType", value, { shouldDirty: true }),
    handleRhFactorChange: (value: ProfileEditFormValues["rhFactor"]) =>
      setValue("rhFactor", value, { shouldDirty: true }),
    handleAllergyInputChange: (value: string) =>
      setValue("allergyInput", value, { shouldDirty: true }),
    handleChronicInputChange: (value: string) =>
      setValue("chronicInput", value, { shouldDirty: true }),
    handleAddAllergy: (value: string) => addItem(value, "allergies"),
    handleSelectAllergySearchResult: (result: ProfileTagSearchResult) => {
      if (result.type === "DISEASE") {
        return;
      }

      const selectedItem: UserProfilePatchAllergyItem = {
        type: result.type,
        value: result.value,
        name: result.name,
      };
      setSelectedAllergyItems((prev) => ({
        ...prev,
        [result.label]: selectedItem,
      }));
      addItem(result.label, "allergies");
      setValue("allergyInput", "", { shouldDirty: true });
    },
    handleRemoveAllergy: (value: string) => {
      removeItem(value, "allergies");
      setSelectedAllergyItems((prev) => {
        const next = { ...prev };
        delete next[value];
        return next;
      });
    },
    handleAddChronicCondition: (value: string) => {
      addItem(value, "chronicConditions");
      const option = chronicConditionOptions.find((item) => item.label === value);
      if (option) {
        setSelectedChronicConditionCodes((prev) => ({ ...prev, [value]: option.code }));
      }
    },
    handleSelectChronicSearchResult: (result: ProfileTagSearchResult) => {
      setSelectedChronicConditionCodes((prev) => ({
        ...prev,
        [result.label]: result.value,
      }));
      addItem(result.label, "chronicConditions");
      setValue("chronicInput", "", { shouldDirty: true });
    },
    handleRemoveChronicCondition: (value: string) => {
      removeItem(value, "chronicConditions");
      setSelectedChronicConditionCodes((prev) => {
        const next = { ...prev };
        delete next[value];
        return next;
      });
    },
    handleSubmit: handleSubmit(handleSubmitValid, onInvalid),
    allergySearchResults,
    isAllergySearchEnabled,
    isAllergySearchFetching,
    isAllergySearchFetchingNextPage,
    hasMoreAllergyResults,
    handleLoadMoreAllergyResults: fetchMoreAllergyResults,
    chronicSearchResults,
    isChronicSearchEnabled,
    isChronicSearchFetching,
    isChronicSearchFetchingNextPage,
    hasMoreChronicResults,
    handleLoadMoreChronicResults: fetchMoreChronicResults,
  };
}

import { zodResolver } from "@hookform/resolvers/zod";
import { forwardRef, useImperativeHandle } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView } from "react-native";
import { Input, Text, XStack, YStack } from "tamagui";
import { SelectChip } from "@/components/ui/SelectChip";
import { palette } from "@/constants/design-tokens";
import { bloodOptions, genderOptions, rhOptions } from "@/constants/health-profile-options";
import { type TutorialStep1FormValues, tutorialStep1Schema } from "@/features/tutorial/schema";
import type { StepHandle } from "@/features/tutorial/types";
import { useUserStore } from "@/stores/userStore";
import { combineBloodTypeWithRh, splitBloodTypeWithRh } from "@/utils/blood-type";
import { formatBirthDateToCompact, parseCompactBirthDate } from "@/utils/date";

export const Step1 = forwardRef<StepHandle>(function Step1(_props, ref) {
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);
  const { bloodType: defaultBloodType, rhFactor: defaultRhFactor } = splitBloodTypeWithRh(
    user?.bloodType,
  );

  const { control, handleSubmit } = useForm<TutorialStep1FormValues>({
    resolver: zodResolver(tutorialStep1Schema),
    defaultValues: {
      birthDate: user?.birthDate != null ? (formatBirthDateToCompact(user.birthDate) ?? "") : "",
      height: user?.height != null ? String(user.height) : "",
      weight: user?.weight != null ? String(user.weight) : "",
      bloodType: defaultBloodType ?? "A",
      rhFactor: defaultRhFactor ?? "positive",
      gender: user?.gender ?? "male",
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      submit: () =>
        new Promise<boolean>((resolve) => {
          void handleSubmit(
            (data) => {
              const birthDate = parseCompactBirthDate(data.birthDate);
              if (!birthDate) {
                resolve(false);
                return;
              }

              updateUser({
                birthDate,
                height: Math.round(Number(data.height.replace(",", "."))),
                weight: Math.round(Number(data.weight.replace(",", "."))),
                bloodType: combineBloodTypeWithRh(data.bloodType, data.rhFactor),
                gender: data.gender,
              });
              resolve(true);
            },
            () => resolve(false),
          )();
        }),
    }),
    [handleSubmit, updateUser],
  );

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
    >
      <YStack gap={22} pt={8}>
        <Text fontSize={18} fontWeight="700" color={palette.black}>
          기본 건강 정보
        </Text>
        <Text fontSize={14} color={palette.icon} lineHeight={20}>
          서비스 맞춤에 사용됩니다. 언제든 프로필에서 수정할 수 있어요.
        </Text>

        <YStack gap={8}>
          <FieldLabel>생년월일</FieldLabel>
          <Controller
            control={control}
            name="birthDate"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <>
                <Input
                  value={value}
                  onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, 6))}
                  onBlur={onBlur}
                  placeholder="ex) 950101"
                  keyboardType="number-pad"
                  maxLength={6}
                  bg={palette.gray}
                  borderWidth={1}
                  borderColor={error ? palette.red : palette.dark_gray}
                  color={palette.black}
                  px={14}
                  height={45}
                />
                {error ? (
                  <Text fontSize={12} style={{ color: palette.red }}>
                    {error.message}
                  </Text>
                ) : null}
              </>
            )}
          />
        </YStack>

        <YStack gap={8}>
          <FieldLabel>키 (cm)</FieldLabel>
          <Controller
            control={control}
            name="height"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <>
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="예: 170"
                  bg={palette.gray}
                  borderWidth={1}
                  borderColor={error ? palette.red : palette.dark_gray}
                  color={palette.black}
                  px={14}
                  height={45}
                />
                {error ? (
                  <Text fontSize={12} style={{ color: palette.red }}>
                    {error.message}
                  </Text>
                ) : null}
              </>
            )}
          />
        </YStack>

        <YStack gap={8}>
          <FieldLabel>몸무게 (kg)</FieldLabel>
          <Controller
            control={control}
            name="weight"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <>
                <Input
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="decimal-pad"
                  placeholder="예: 65"
                  bg={palette.gray}
                  borderWidth={1}
                  borderColor={error ? palette.red : palette.dark_gray}
                  color={palette.black}
                  px={14}
                  height={45}
                />
                {error ? (
                  <Text fontSize={12} style={{ color: palette.red }}>
                    {error.message}
                  </Text>
                ) : null}
              </>
            )}
          />
        </YStack>

        <YStack gap={10}>
          <FieldLabel>혈액형</FieldLabel>
          <Controller
            control={control}
            name="bloodType"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <XStack gap={8} flexWrap="wrap">
                  {bloodOptions.map((opt) => {
                    const selected = value === opt.value;
                    return (
                      <SelectChip
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        label={opt.label}
                        selected={selected}
                        accessibilityLabel={opt.label}
                      />
                    );
                  })}
                </XStack>
                {error ? (
                  <Text fontSize={12} style={{ color: palette.red }}>
                    {error.message}
                  </Text>
                ) : null}
              </>
            )}
          />
          <Controller
            control={control}
            name="rhFactor"
            render={({
              field: { onChange: onRhFactorChange, value: rhValue },
              fieldState: { error: rhError },
            }) => (
              <>
                <XStack gap={10}>
                  {rhOptions.map((opt) => (
                    <SelectChip
                      key={opt.value}
                      onPress={() => onRhFactorChange(opt.value)}
                      label={opt.label}
                      selected={rhValue === opt.value}
                      accessibilityLabel={opt.label}
                      flex={1}
                    />
                  ))}
                </XStack>
                {rhError ? (
                  <Text fontSize={12} style={{ color: palette.red }}>
                    {rhError.message}
                  </Text>
                ) : null}
              </>
            )}
          />
        </YStack>

        <YStack gap={10}>
          <FieldLabel>성별</FieldLabel>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <>
                <XStack gap={10}>
                  {genderOptions.map((opt) => {
                    const selected = value === opt.value;
                    return (
                      <SelectChip
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        label={opt.label}
                        selected={selected}
                        accessibilityLabel={opt.label}
                        flex={1}
                      />
                    );
                  })}
                </XStack>
                {error ? (
                  <Text fontSize={12} style={{ color: palette.red }}>
                    {error.message}
                  </Text>
                ) : null}
              </>
            )}
          />
        </YStack>
      </YStack>
    </ScrollView>
  );
});

function FieldLabel({ children }: { children: string }) {
  return (
    <Text fontSize={14} fontWeight="600" color={palette.black}>
      {children}
    </Text>
  );
}

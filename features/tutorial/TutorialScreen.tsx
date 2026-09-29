import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, XStack, YStack } from "tamagui";
import { getApiErrorMessage } from "@/api/error";
import { useCompleteTutorialMutation } from "@/api/queries/user";
import { AuthGateView } from "@/components/AuthGateView";
import { PillButton } from "@/components/ui/PillButton";
import { SegmentedStepProgress } from "@/components/ui/SegmentedStepProgress";
import { palette } from "@/constants/design-tokens";
import { useAuthRouteState } from "@/hooks/useAuthRouteState";
import { useScreenBottomPadding } from "@/hooks/useScreenBottomPadding";
import { useUserStore } from "@/stores/userStore";
import { userToTutorialRegistrationBody } from "@/utils/user-mapper";
import { Step1 } from "./components/Step1";
import { Step2 } from "./components/Step2";
import { Step3 } from "./components/Step3";
import { Step4 } from "./components/Step4";
import type { StepHandle } from "./types";

const TOTAL_STEPS = 4;

export function TutorialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPadding = useScreenBottomPadding(16);
  const authState = useAuthRouteState();
  const user = useUserStore((s) => s.user);
  const completeTutorial = useCompleteTutorialMutation();

  const [step, setStep] = useState(0);
  const step1Ref = useRef<StepHandle>(null);
  const step2Ref = useRef<StepHandle>(null);
  const step3Ref = useRef<StepHandle>(null);
  const step4Ref = useRef<StepHandle>(null);

  if (authState.kind === "loading") {
    return <AuthGateView kind="loading" />;
  }

  if (authState.kind === "error") {
    return <AuthGateView kind="error" onRetry={authState.retry} onLogout={authState.logout} />;
  }

  if (authState.href !== "/(auth)/tutorial") {
    return <Redirect href={authState.href} />;
  }

  if (!user) {
    return <AuthGateView kind="loading" />;
  }

  const handleComplete = async () => {
    const latest = useUserStore.getState().user;
    if (!latest) return;
    if (!latest.birthDate) {
      Alert.alert("입력 확인", "생년월일을 입력해 주세요.");
      setStep(0);
      return;
    }
    try {
      await completeTutorial.mutateAsync(userToTutorialRegistrationBody(latest));
      router.replace("/(tabs)/dashboard");
    } catch (error) {
      const message = await getApiErrorMessage(error, "튜토리얼 저장에 실패했습니다.");
      Alert.alert("오류", message);
    }
  };

  const goNext = async () => {
    const stepRefs = [step1Ref, step2Ref, step3Ref, step4Ref];
    const submitFn = stepRefs[step]?.current?.submit;
    const isValid = submitFn ? await submitFn() : false;

    if (!isValid) return;

    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      await handleComplete();
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  };

  const isFirstStep = step === 0;

  return (
    <YStack flex={1}>
      <LinearGradient colors={palette.bg_pink_line} style={{ flex: 1 }}>
        <YStack flex={1} pt={insets.top + 12}>
          <XStack px={20}>
            <SegmentedStepProgress currentIndex={step} totalSteps={TOTAL_STEPS} />
          </XStack>

          <YStack flex={1}>
            {step === 0 && <Step1 ref={step1Ref} />}
            {step === 1 && <Step2 ref={step2Ref} />}
            {step === 2 && <Step3 ref={step3Ref} />}
            {step === 3 && <Step4 ref={step4Ref} />}
          </YStack>

          <XStack
            bg="$background"
            gap={12}
            px={20}
            pt={12}
            pb={bottomPadding}
            width="100%"
            items="stretch"
          >
            <PillButton
              variant="outline"
              accessibilityLabel="이전 단계"
              disabled={isFirstStep}
              onPress={goPrev}
            >
              <Text fontSize={14} fontWeight="600" color={palette.black}>
                이전
              </Text>
            </PillButton>
            <PillButton
              variant="solid"
              accessibilityLabel={step === TOTAL_STEPS - 1 ? "튜토리얼 완료" : "다음 단계"}
              onPress={() => void goNext()}
              disabled={completeTutorial.isPending}
              rightElement={<Ionicons name="chevron-forward" size={16} color={palette.white} />}
            >
              <Text fontSize={14} fontWeight="600" color={palette.white}>
                {completeTutorial.isPending
                  ? "저장 중…"
                  : step === TOTAL_STEPS - 1
                    ? "시작하기"
                    : "다음"}
              </Text>
            </PillButton>
          </XStack>
        </YStack>
      </LinearGradient>
    </YStack>
  );
}

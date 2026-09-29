import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef, useImperativeHandle } from "react";
import { ScrollView } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "@/components/ui/Button";
import { palette } from "@/constants/design-tokens";
import type { StepHandle } from "@/features/tutorial/types";

export const Step4 = forwardRef<StepHandle>(function Step4(_props, ref) {
  const handleAddFamilyMember = () => {
    // 가족 구성원 등록 플로우 연결 예정
  };

  useImperativeHandle(ref, () => ({
    submit: () => Promise.resolve(true),
  }));

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
    >
      <YStack gap={20} pt={8} pb={16}>
        <YStack items="center" gap={10} mt={8}>
          <LinearGradient
            colors={[palette.green, palette.opal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 82,
              height: 82,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="person-outline" size={42} color={palette.background} />
          </LinearGradient>
          <Text fontSize={18} fontWeight="700" color={palette.black}>
            가족 관리
          </Text>
          <Text fontSize={16} color={palette.icon}>
            가족 모두의 건강을 한곳에서
          </Text>
        </YStack>

        <YStack
          bg={palette.background}
          px={14}
          py={14}
          style={{
            borderColor: palette.light_green,
            borderWidth: 1,
            borderRadius: 18,
          }}
        >
          <XStack items="center" gap={10}>
            <LinearGradient
              colors={[palette.green, palette.opal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 42,
                height: 42,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="person-outline" size={20} color={palette.background} />
            </LinearGradient>
            <YStack>
              <Text fontSize={16} fontWeight="600" color={palette.black}>
                본인
              </Text>
              <Text fontSize={12} color={palette.icon}>
                주 사용자
              </Text>
            </YStack>
          </XStack>
        </YStack>

        <LinearGradient
          colors={[palette.green, palette.opal]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ borderRadius: 12 }}
        >
          <Button height={32} onPress={handleAddFamilyMember} accessibilityLabel="가족 구성원 추가">
            <XStack items="center" gap={6}>
              <Ionicons name="add" size={16} color={palette.background} />
              <Text fontSize={14} fontWeight="600" color={palette.background}>
                가족 구성원 추가
              </Text>
            </XStack>
          </Button>
        </LinearGradient>

        <Text fontSize={12} color={palette.icon} style={{ textAlign: "center" }}>
          프로필을 전환하여 각 가족의 복약을 따로 관리할 수 있어요
        </Text>
      </YStack>
    </ScrollView>
  );
});

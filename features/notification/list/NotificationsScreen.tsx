import { FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, YStack } from "tamagui";

import type { NotificationItem } from "@/api/types";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PillButton } from "@/components/ui/PillButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { palette } from "@/constants/design-tokens";
import { useScreenBottomPadding } from "@/hooks/useScreenBottomPadding";
import { NotificationCard } from "./components/NotificationCard";
import { NotificationHeader } from "./components/NotificationHeader";
import { useNotificationsViewModel } from "./useNotificationsViewModel";

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const bottomPadding = useScreenBottomPadding(24);
  const viewModel = useNotificationsViewModel();

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <NotificationCard item={item} onPress={viewModel.handlePressNotification} />
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 14, paddingBottom: bottomPadding },
      ]}
      data={[...viewModel.items]}
      keyExtractor={(item) => String(item.notificationId)}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <YStack gap={14} style={styles.headerSection}>
          <NotificationHeader
            unreadCount={viewModel.unreadCount}
            onPressBack={viewModel.handlePressBack}
            onPressMarkAllRead={viewModel.handlePressMarkAllRead}
            isMarkAllReadDisabled={viewModel.unreadCount === 0 || viewModel.isMarkAllReadPending}
          />

          {viewModel.isLoading ? (
            <YStack style={styles.feedbackBox} gap={10}>
              <LoadingSpinner accessibilityLabel="알림 로딩 중" />
              <Text style={styles.feedbackText}>알림을 불러오는 중입니다.</Text>
            </YStack>
          ) : null}

          {viewModel.isError ? (
            <YStack style={styles.feedbackBox} gap={10}>
              <Text style={styles.feedbackText}>알림을 불러오지 못했습니다.</Text>
              <PillButton variant="outline" onPress={() => viewModel.refetch()} flex={0}>
                <Text style={styles.retryText}>다시 시도</Text>
              </PillButton>
            </YStack>
          ) : null}
        </YStack>
      }
      renderItem={renderItem}
      ItemSeparatorComponent={() => <YStack height={10} />}
      ListEmptyComponent={
        !viewModel.isLoading && !viewModel.isError ? (
          <SurfaceCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>받은 알림이 없습니다.</Text>
          </SurfaceCard>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
  },
  headerSection: {
    marginBottom: 14,
  },
  feedbackBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 42,
  },
  feedbackText: {
    color: palette.black,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  retryText: {
    color: palette.green_deep,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    color: palette.icon,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
});

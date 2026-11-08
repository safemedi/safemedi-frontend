import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";

const scheduledClients = new WeakSet<QueryClient>();

/** onSettled도 pending이므로 실제 mutation 종료 이벤트 이후에 재조회한다. */
export function invalidateTodaySchedulesAfterWrites(client: QueryClient): void {
  if (scheduledClients.has(client)) return;
  scheduledClients.add(client);
  const unsubscribe = client.getMutationCache().subscribe(() => {
    const pending =
      client.isMutating({ mutationKey: queryKeys.dashboard.markRecords }) +
      client.isMutating({ mutationKey: queryKeys.prescriptions.update });
    if (pending > 0) return;
    unsubscribe();
    scheduledClients.delete(client);
    void client.invalidateQueries({ queryKey: queryKeys.dashboard.todayMedicationSchedules });
    void client.invalidateQueries({ queryKey: queryKeys.medications.all });
  });
}

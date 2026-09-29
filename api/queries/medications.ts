import { useQuery } from "@tanstack/react-query";

import { fetchMedicationRecords, fetchMedicationStatistics } from "@/api/endpoints/medications";
import { queryKeys } from "@/api/query-keys";
import { useSessionStore } from "@/stores/sessionStore";

const STALE_MS = 60 * 1000;

interface UseMedicationDailyRecordsParams {
  readonly date: string;
  readonly familyId?: number;
  readonly enabled?: boolean;
}

export function useMedicationDailyRecords(params: UseMedicationDailyRecordsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);
  const isEnabled = params.enabled !== false && !!accessToken && params.date.length > 0;

  return useQuery({
    queryKey: queryKeys.medications.records("DAILY", params.date, params.familyId),
    enabled: isEnabled,
    staleTime: STALE_MS,
    queryFn: () =>
      fetchMedicationRecords({
        type: "DAILY",
        date: params.date,
        familyId: params.familyId,
      }),
  });
}

interface UseMedicationStatisticsParams {
  readonly startDate: string;
  readonly endDate: string;
  readonly enabled?: boolean;
}

export function useMedicationStatistics(params: UseMedicationStatisticsParams) {
  const accessToken = useSessionStore((state) => state.accessToken);
  const isEnabled =
    params.enabled !== false &&
    !!accessToken &&
    params.startDate.length > 0 &&
    params.endDate.length > 0;

  return useQuery({
    queryKey: queryKeys.medications.statistics(params.startDate, params.endDate),
    enabled: isEnabled,
    staleTime: STALE_MS,
    queryFn: () =>
      fetchMedicationStatistics({ startDate: params.startDate, endDate: params.endDate }),
  });
}

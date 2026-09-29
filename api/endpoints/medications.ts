import { api } from "@/api/client";
import { apiPaths } from "@/api/paths";
import type {
  DailyMedicationRecordsResponse,
  MedicationRecordItem,
  MedicationRecordStatus,
  MedicationRecordsQueryType,
  MedicationRecordsSummary,
  MedicationStatisticsDailyCompliance,
  MedicationStatisticsResponse,
  MonthlyMedicationRecordGroup,
  MonthlyMedicationRecordsResponse,
} from "@/api/types/medications";

interface FetchMedicationRecordsParams {
  readonly type: MedicationRecordsQueryType;
  readonly date: string;
  readonly familyId?: number;
}

interface FetchMedicationStatisticsParams {
  readonly startDate: string;
  readonly endDate: string;
}

interface WireMedicationRecordSummary {
  readonly totalCount: number;
  readonly takenCount: number;
  readonly fraction: string;
}

interface WireDailyMedicationRecordItem {
  readonly recordId: number;
  readonly prescriptionTitle: string;
  readonly medicationNames?: readonly string[];
  readonly scheduledTime: string;
  readonly takenTime?: string | null;
  readonly status: string;
}

interface WirePeriodMedicationRecordItem {
  readonly recordId: number;
  readonly prescriptionTitle: string;
  readonly scheduledTime: string;
  readonly status: string;
}

interface WirePeriodMedicationRecordGroup {
  readonly date: string;
  readonly totalCount?: number;
  readonly takenCount?: number;
  readonly fraction?: string;
  readonly items: readonly WirePeriodMedicationRecordItem[];
}

interface WireMedicationRecordQueryResponse {
  readonly type?: string;
  readonly date?: string | null;
  readonly periodStartDate?: string | null;
  readonly periodEndDate?: string | null;
  readonly familyId?: number | null;
  readonly relation?: string | null;
  readonly summary?: WireMedicationRecordSummary;
  readonly records?: readonly WireDailyMedicationRecordItem[] | null;
  readonly dailyRecords?: readonly WirePeriodMedicationRecordGroup[] | null;
}

interface WireMedicationStatisticsResponse {
  readonly startDate: string;
  readonly endDate: string;
  readonly totalCount: number;
  readonly takenCount: number;
  readonly fraction: string;
  readonly dailyCompliance: readonly MedicationStatisticsDailyCompliance[];
}

function normalizeMonthReferenceDate(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function resolveMedicationRecordsDate(type: MedicationRecordsQueryType, date: string): string {
  if (type === "MONTH") {
    return normalizeMonthReferenceDate(date);
  }

  return date;
}

function computeComplianceRate(takenCount: number, totalCount: number): number {
  if (totalCount === 0) {
    return 0;
  }

  return Math.round((takenCount / totalCount) * 1000) / 10;
}

function normalizeSummary(summary: WireMedicationRecordSummary): MedicationRecordsSummary {
  return {
    totalCount: summary.totalCount,
    takenCount: summary.takenCount,
    fraction: summary.fraction,
    complianceRate: computeComplianceRate(summary.takenCount, summary.totalCount),
  };
}

function normalizeRecordStatus(status: string): MedicationRecordStatus {
  if (status === "SUCCESS" || status === "PENDING") {
    return status;
  }

  return "PENDING";
}

function normalizeDailyRecordItem(item: WireDailyMedicationRecordItem): MedicationRecordItem {
  return {
    recordId: item.recordId,
    prescriptionTitle: item.prescriptionTitle,
    medicationNames: item.medicationNames ?? [],
    scheduledTime: item.scheduledTime,
    takenTime: item.takenTime ?? null,
    status: normalizeRecordStatus(item.status),
  };
}

function normalizePeriodRecordItem(item: WirePeriodMedicationRecordItem): MedicationRecordItem {
  return {
    recordId: item.recordId,
    prescriptionTitle: item.prescriptionTitle,
    medicationNames: [],
    scheduledTime: item.scheduledTime,
    takenTime: null,
    status: normalizeRecordStatus(item.status),
  };
}

function isNormalizedDailyResponse(
  response: WireMedicationRecordQueryResponse | DailyMedicationRecordsResponse,
): response is DailyMedicationRecordsResponse {
  return (
    "summary" in response &&
    response.summary !== undefined &&
    response.summary !== null &&
    "complianceRate" in response.summary
  );
}

function isNormalizedMonthlyResponse(
  response: WireMedicationRecordQueryResponse | MonthlyMedicationRecordsResponse,
): response is MonthlyMedicationRecordsResponse {
  return "period" in response && Array.isArray(response.records);
}

function normalizeDailyMedicationRecords(
  response: WireMedicationRecordQueryResponse | DailyMedicationRecordsResponse,
): DailyMedicationRecordsResponse {
  if (isNormalizedDailyResponse(response)) {
    return response;
  }

  const summary = response.summary ?? { totalCount: 0, takenCount: 0, fraction: "0/0" };

  return {
    date: response.date ?? "",
    familyId: response.familyId ?? undefined,
    relation: response.relation ?? undefined,
    summary: normalizeSummary(summary),
    records: (response.records ?? []).map(normalizeDailyRecordItem),
  };
}

function normalizeMonthlyMedicationRecords(
  response: WireMedicationRecordQueryResponse | MonthlyMedicationRecordsResponse,
): MonthlyMedicationRecordsResponse {
  if (isNormalizedMonthlyResponse(response)) {
    return response;
  }

  const summary = response.summary ?? { totalCount: 0, takenCount: 0, fraction: "0/0" };
  const periodStartDate = response.periodStartDate ?? "";
  const records: MonthlyMedicationRecordGroup[] = (response.dailyRecords ?? []).map((group) => ({
    date: group.date,
    items: group.items.map(normalizePeriodRecordItem),
  }));

  return {
    period: periodStartDate.slice(0, 7),
    summary: normalizeSummary(summary),
    records,
  };
}

function isNormalizedStatisticsResponse(
  response: WireMedicationStatisticsResponse | MedicationStatisticsResponse,
): response is MedicationStatisticsResponse {
  return "totalScheduled" in response;
}

function normalizeMedicationStatistics(
  response: WireMedicationStatisticsResponse | MedicationStatisticsResponse,
): MedicationStatisticsResponse {
  if (isNormalizedStatisticsResponse(response)) {
    return response;
  }

  const totalScheduled = response.totalCount;
  const totalTaken = response.takenCount;

  return {
    startDate: response.startDate,
    endDate: response.endDate,
    totalScheduled,
    totalTaken,
    totalComplianceRate: computeComplianceRate(totalTaken, totalScheduled),
    dailyCompliance: response.dailyCompliance ?? [],
  };
}

export async function fetchMedicationRecords(
  params: FetchMedicationRecordsParams & { readonly type: "DAILY" },
): Promise<DailyMedicationRecordsResponse>;
export async function fetchMedicationRecords(
  params: FetchMedicationRecordsParams & { readonly type: "MONTH" | "WEEK" },
): Promise<MonthlyMedicationRecordsResponse>;
export async function fetchMedicationRecords(
  params: FetchMedicationRecordsParams,
): Promise<DailyMedicationRecordsResponse | MonthlyMedicationRecordsResponse> {
  const searchParams: Record<string, string> = {
    type: params.type,
    date: resolveMedicationRecordsDate(params.type, params.date),
  };

  if (params.familyId !== undefined) {
    searchParams.familyId = String(params.familyId);
  }

  const response = await api
    .get(apiPaths.medicationRecords, { searchParams })
    .json<WireMedicationRecordQueryResponse>();

  if (params.type === "DAILY") {
    return normalizeDailyMedicationRecords(response);
  }

  return normalizeMonthlyMedicationRecords(response);
}

export async function fetchMedicationStatistics(
  params: FetchMedicationStatisticsParams,
): Promise<MedicationStatisticsResponse> {
  const response = await api
    .get(apiPaths.medicationsStatistics, {
      searchParams: { startDate: params.startDate, endDate: params.endDate },
    })
    .json<WireMedicationStatisticsResponse | MedicationStatisticsResponse>();

  return normalizeMedicationStatistics(response);
}

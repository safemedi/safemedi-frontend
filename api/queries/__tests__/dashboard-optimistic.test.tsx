import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { queryKeys } from "@/api/query-keys";
import type { TodayMedicationSchedulesResponse } from "@/api/types/dashboard";
import { useMarkMedicationRecordsMutation } from "../dashboard";

const mockUpdateRecords = jest.fn();
jest.mock("@/api/endpoints/dashboard", () => ({
  updateMedicationRecords: (...args: unknown[]) => mockUpdateRecords(...args),
}));
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const schedules: TodayMedicationSchedulesResponse = {
  date: "2026-11-05",
  summary: { totalCount: 2, completedCount: 0, completionRate: 0 },
  schedules: [1, 2].map((id) => ({
    prescriptionId: id,
    prescriptionTitle: `처방전${id}`,
    takeTime: "08:00",
    drugCount: 1,
    recordIds: [id],
    displayStatus: "NEED_TAKE",
  })),
};
function setup() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  function wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, wrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
});
it("복약 요청 하나가 실패해도 다른 항목의 완료 상태와 완료율을 유지한다", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(queryKeys.dashboard.todayMedicationSchedules, schedules);
  const first = deferred<unknown>();
  const second = deferred<unknown>();
  mockUpdateRecords.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const { result } = renderHook(() => useMarkMedicationRecordsMutation(), { wrapper });
  let firstResult!: Promise<unknown>;
  let secondResult!: Promise<unknown>;
  await act(async () => {
    firstResult = result.current
      .mutateAsync({ recordIds: [1], status: "SUCCESS" })
      .catch(() => undefined);
  });
  await act(async () => {
    secondResult = result.current.mutateAsync({ recordIds: [2], status: "SUCCESS" });
  });
  expect(
    client.getQueryData<TodayMedicationSchedulesResponse>(
      queryKeys.dashboard.todayMedicationSchedules,
    )?.summary.completedCount,
  ).toBe(2);
  await act(async () => {
    first.reject(new Error("실패"));
    await firstResult;
  });
  const current = client.getQueryData<TodayMedicationSchedulesResponse>(
    queryKeys.dashboard.todayMedicationSchedules,
  );
  expect(current?.schedules.map((item) => item.displayStatus)).toEqual(["NEED_TAKE", "SUCCESS"]);
  expect(current?.summary).toEqual({ totalCount: 2, completedCount: 1, completionRate: 50 });
  expect(invalidate).not.toHaveBeenCalled();
  await act(async () => {
    second.resolve({});
    await secondResult;
  });
  expect(invalidate).toHaveBeenCalledWith({
    queryKey: queryKeys.dashboard.todayMedicationSchedules,
  });
  client.clear();
});

it("두 복약 요청이 같은 시점에 끝나도 마지막에 한 번 재조회한다", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(queryKeys.dashboard.todayMedicationSchedules, schedules);
  const request = deferred<unknown>();
  mockUpdateRecords.mockReturnValue(request.promise);
  const invalidate = jest.spyOn(client, "invalidateQueries");
  const { result } = renderHook(() => useMarkMedicationRecordsMutation(), { wrapper });
  let first!: Promise<unknown>;
  let second!: Promise<unknown>;
  await act(async () => {
    first = result.current.mutateAsync({ recordIds: [1], status: "SUCCESS" });
    second = result.current.mutateAsync({ recordIds: [2], status: "SUCCESS" });
  });
  await act(async () => {
    request.resolve({});
    await Promise.all([first, second]);
  });
  expect(
    invalidate.mock.calls.filter(
      ([filter]) => filter?.queryKey === queryKeys.dashboard.todayMedicationSchedules,
    ),
  ).toHaveLength(1);
  client.clear();
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import { queryKeys } from "@/api/query-keys";
import type { FamilySummary } from "@/api/types/family";
import { useUpdateFamilyRelation } from "../family";

const mockUpdateRelation = jest.fn();
jest.mock("@/api/endpoints/family", () => ({
  updateFamilyRelation: (...args: unknown[]) => mockUpdateRelation(...args),
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
it("가족 호칭을 즉시 바꾸고 실패하면 해당 가족만 복구한다", async () => {
  const { client, wrapper } = setup();
  client.setQueryData(queryKeys.family.list, [
    { familyId: 1, name: "가족", relation: "어머니" },
    { familyId: 2, name: "가족2", relation: "아버지" },
  ]);
  const request = deferred<unknown>();
  mockUpdateRelation.mockReturnValue(request.promise);
  const { result } = renderHook(() => useUpdateFamilyRelation(), { wrapper });
  let pending!: Promise<unknown>;
  await act(async () => {
    pending = result.current
      .mutateAsync({ familyId: 1, body: { relation: "엄마" } })
      .catch(() => undefined);
  });
  expect(client.getQueryData<FamilySummary[]>(queryKeys.family.list)?.[0].relation).toBe("엄마");
  client.setQueryData<FamilySummary[]>(queryKeys.family.list, (data) =>
    data?.filter((item) => item.familyId === 1),
  );
  await act(async () => {
    request.reject(new Error("실패"));
    await pending;
  });
  expect(client.getQueryData<FamilySummary[]>(queryKeys.family.list)).toEqual([
    { familyId: 1, name: "가족", relation: "어머니" },
  ]);
  client.clear();
});

import { apiPaths } from "@/api/paths";
import {
  deletePrescription,
  fetchPrescription,
  fetchPrescriptions,
  updatePrescription,
} from "../prescriptions";

const mockApiGet = jest.fn();
const mockApiPatch = jest.fn();
const mockApiDelete = jest.fn();

jest.mock("@/api/client", () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    patch: (...args: unknown[]) => mockApiPatch(...args),
    delete: (...args: unknown[]) => mockApiDelete(...args),
  },
}));

describe("api/endpoints/prescriptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("처방전 목록을 GET으로 조회한다", async () => {
    const expected = { prescriptions: [] };
    mockApiGet.mockReturnValueOnce({ json: jest.fn(async () => expected) });

    const result = await fetchPrescriptions();

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.prescriptions);
    expect(result).toEqual(expected);
  });

  it("처방전 목록 조회 실패를 호출자에게 전달한다", async () => {
    mockApiGet.mockImplementationOnce(() => {
      throw new Error("network down");
    });

    await expect(fetchPrescriptions()).rejects.toThrow("network down");
  });

  it("처방전 상세를 prescriptionId로 조회한다", async () => {
    const expected = {
      prescriptionId: 11,
      title: "신장내과 처방전",
      startDate: "2026-05-19",
      endDate: "2026-05-25",
      isDoctorApproved: false,
      hasAllergyConflict: false,
      medications: [],
    };
    mockApiGet.mockReturnValueOnce({ json: jest.fn(async () => expected) });

    const result = await fetchPrescription(11);

    expect(mockApiGet).toHaveBeenCalledWith(apiPaths.prescription(11));
    expect(result).toEqual({
      ...expected,
      drugCount: 0,
      medications: [],
    });
  });

  it("처방전 수정 PATCH 요청을 호출한다", async () => {
    const expected = { prescriptionId: 11, title: "수정", message: "ok" };
    mockApiPatch.mockReturnValueOnce({ json: jest.fn(async () => expected) });

    const result = await updatePrescription(11, {
      medications: [{ prescriptionDrugId: 101, takeTimes: ["08:00"] }],
    });

    expect(mockApiPatch).toHaveBeenCalledWith(apiPaths.prescription(11), {
      json: {
        medications: [{ prescriptionDrugId: 101, takeTimes: ["08:00"] }],
      },
    });
    expect(result).toEqual(expected);
  });

  it("처방전 DELETE 요청을 호출한다", async () => {
    const expected = { message: "deleted" };
    mockApiDelete.mockReturnValueOnce({ json: jest.fn(async () => expected) });

    const result = await deletePrescription(11);

    expect(mockApiDelete).toHaveBeenCalledWith(apiPaths.prescription(11));
    expect(result).toEqual(expected);
  });
});

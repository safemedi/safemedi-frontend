import {
  hasOnlyPlaceholderMedications,
  parsePrescriptionFromJson,
  parsePrescriptionFromOcrText,
} from "../ocr-parser";

describe("ocr-parser", () => {
  it("OCR 텍스트에서 처방전 draft를 추출한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      서울가정의학과 처방전
      2026.05.13 ~ 2026.05.20
      타이레놀정 500mg
      아목시실린캡슐 250mg
      복용시간 09:00 21:00
    `);

    expect(draft.title).toBe("서울가정의학과 처방전");
    expect(draft.startDate).toBe("2026-05-13");
    expect(draft.endDate).toBe("2026-05-20");
    expect(draft.medications.length).toBeGreaterThan(0);
    expect(draft.isDateRangeConfident).toBe(true);
  });

  it("직접 입력 JSON을 검증하여 draft로 변환한다", () => {
    const draft = parsePrescriptionFromJson(`{
      "title": "직접 입력 처방전",
      "startDate": "2026-05-13",
      "endDate": "2026-05-20",
      "medications": [{ "atcCode": "UNKNOWN", "drugName": "타이레놀정 500mg" }],
      "rawText": "manual"
    }`);

    expect(draft.title).toBe("직접 입력 처방전");
    expect(draft.medications[0]?.drugName).toBe("타이레놀정 500mg");
  });

  it("직접 입력 JSON에서 title은 빈 문자열을 허용한다", () => {
    const draft = parsePrescriptionFromJson(`{
      "title": "",
      "startDate": "2026-05-13",
      "endDate": "2026-05-20",
      "medications": [{ "atcCode": "UNKNOWN", "drugName": "타이레놀정 500mg" }],
      "rawText": "manual"
    }`);

    expect(draft.title).toBe("");
  });

  it("빈 OCR 텍스트면 에러를 발생시킨다", () => {
    expect(() => parsePrescriptionFromOcrText(" ")).toThrow(
      "OCR 결과가 비어 있습니다. 이미지가 선명한지 확인해 주세요.",
    );
  });

  it("병원·환자 등 관리 정보 줄은 약물 후보에서 제외한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      서울가정의학과 처방전
      환자 홍길동
      약국 조제
      2026.05.13 ~ 2026.05.20
      타이레놀정 500mg
    `);

    expect(draft.medications).toEqual([{ atcCode: "UNKNOWN", drugName: "타이레놀정 500mg" }]);
  });

  it("중복된 약물 줄은 하나로 합친다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      타이레놀정 500mg
      타이레놀정 500mg
      2026.05.13 ~ 2026.05.20
    `);

    expect(draft.medications).toEqual([{ atcCode: "UNKNOWN", drugName: "타이레놀정 500mg" }]);
  });

  it("약물 후보를 찾지 못하면 미확인 약물로 대체하고 저신뢰 결과로 판별된다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      2026.05.13 ~ 2026.05.20
      다음 방문일에 다시 오세요
    `);

    expect(draft.medications).toEqual([{ atcCode: "UNKNOWN", drugName: "미확인 약물" }]);
    expect(hasOnlyPlaceholderMedications(draft.medications)).toBe(true);
  });

  it("정상적으로 약물을 찾으면 저신뢰 결과가 아니다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      타이레놀정 500mg
      2026.05.13 ~ 2026.05.20
    `);

    expect(hasOnlyPlaceholderMedications(draft.medications)).toBe(false);
  });

  it("날짜만 있는 줄은 제목 후보에서 제외한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      2026.05.13 ~ 2026.05.20
      서울가정의학과 처방전
      타이레놀정 500mg
    `);

    expect(draft.title).toBe("서울가정의학과 처방전");
  });

  it("병원/약국 등 사업자명이 있으면 해당 줄을 제목으로 사용한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      약제비 계산서·영수증
      용인서울이비인후과의원(황정원)
      환자정보 조건희
      멕시네정
    `);

    expect(draft.title).toBe("용인서울이비인후과의원(황정원)");
  });

  it("N일분 표기가 있으면 오늘부터 N일 뒤까지를 복약 기간으로 설정한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      멕시네정
      5일분
    `);

    const today = new Date();
    const expectedEndDate = new Date(today);
    expectedEndDate.setDate(expectedEndDate.getDate() + 5);

    expect(draft.startDate).toBe(today.toISOString().slice(0, 10));
    expect(draft.endDate).toBe(expectedEndDate.toISOString().slice(0, 10));
    expect(draft.isDateRangeConfident).toBe(true);
  });

  it("명시적 날짜가 2개 인식되면 신뢰도 높음으로 판단한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      멕시네정
      2026.05.13 ~ 2026.05.20
    `);

    expect(draft.isDateRangeConfident).toBe(true);
  });

  it("날짜를 하나도 못 찾거나 하나만 찾으면 신뢰도가 낮다고 판단한다", () => {
    const noDateDraft = parsePrescriptionFromOcrText(`
      처방전
      멕시네정
    `);
    const oneDateDraft = parsePrescriptionFromOcrText(`
      처방전
      멕시네정
      2026.05.13
    `);

    expect(noDateDraft.isDateRangeConfident).toBe(false);
    expect(oneDateDraft.isDateRangeConfident).toBe(false);
  });

  it("1일 N회 표기가 있으면 해당 약물의 dailyDoseCount로 추출한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      멕시네정
      1일 3회 복용
    `);

    expect(draft.medications[0]?.dailyDoseCount).toBe(3);
  });

  it("1일 N회 표기가 없으면 dailyDoseCount는 undefined다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      멕시네정
    `);

    expect(draft.medications[0]?.dailyDoseCount).toBeUndefined();
  });

  it("N정씩 N회 표기가 있으면 해당 약물의 dailyDoseCount로 추출한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      멕시네정
      1정씩 3회5일분
    `);

    expect(draft.medications[0]?.dailyDoseCount).toBe(3);
  });

  it("약품명 옆 외형 설명(색상/모양/코팅)과 복용법 줄은 약물 후보에서 제외한다", () => {
    const draft = parsePrescriptionFromOcrText(`
      용인서울이비인후과의원(황정원)
      멕시네정
      분홍색 장방형 필름코 팅정
      1정씩 3회5일분
      베포리진정5mg
      흰색 원형 필름코 팅정
      1정씩3회5일분
      코대원정
      흰색원형정제
      1정씩2회5일분
    `);

    expect(draft.medications).toEqual([
      { atcCode: "UNKNOWN", drugName: "멕시네정", dailyDoseCount: 3 },
      { atcCode: "UNKNOWN", drugName: "베포리진정5mg", dailyDoseCount: 3 },
      { atcCode: "UNKNOWN", drugName: "코대원정", dailyDoseCount: 2 },
    ]);
  });

  it("약물마다 복용법 줄 순서가 대응되면 서로 다른 dailyDoseCount를 갖는다", () => {
    const draft = parsePrescriptionFromOcrText(`
      처방전
      멕시네정
      1정씩 3회5일분
      베포리진정5mg
      1정씩2회5일분
    `);

    expect(draft.medications).toEqual([
      { atcCode: "UNKNOWN", drugName: "멕시네정", dailyDoseCount: 3 },
      { atcCode: "UNKNOWN", drugName: "베포리진정5mg", dailyDoseCount: 2 },
    ]);
  });
});

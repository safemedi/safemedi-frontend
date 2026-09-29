import * as ImagePicker from "expo-image-picker";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";
import { extractDraftFromImageSource, extractDraftFromImageUri } from "../device-ocr";
import { parsePrescriptionFromOcrText } from "../ocr-parser";

const mockRequestCameraPermissionsAsync = jest.fn();
const mockRequestMediaLibraryPermissionsAsync = jest.fn();
const mockLaunchCameraAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
const mockExtractTextFromImage = jest.fn();
const mockManipulate = jest.fn();
const mockRotate = jest.fn();
const mockRenderAsync = jest.fn();
const mockSaveAsync = jest.fn();
const mockRequireOptionalNativeModule = requireOptionalNativeModule as jest.MockedFunction<
  typeof requireOptionalNativeModule
>;
const mockParsePrescriptionFromOcrText = parsePrescriptionFromOcrText as jest.MockedFunction<
  typeof parsePrescriptionFromOcrText
>;
const mockFileDelete = jest.fn();
let mockFileExistsSequence: boolean[] = [];

jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation((uri: string) => ({
    get exists() {
      return mockFileExistsSequence.length > 0 ? mockFileExistsSequence.shift() : true;
    },
    delete: () => mockFileDelete(uri),
  })),
}));

jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  ImageManipulator: {
    manipulate: (...args: unknown[]) => mockManipulate(...args),
  },
}));

jest.mock("expo-image-picker", () => ({
  PermissionStatus: {
    GRANTED: "granted",
    DENIED: "denied",
  },
  requestCameraPermissionsAsync: (...args: unknown[]) => mockRequestCameraPermissionsAsync(...args),
  requestMediaLibraryPermissionsAsync: (...args: unknown[]) =>
    mockRequestMediaLibraryPermissionsAsync(...args),
  launchCameraAsync: (...args: unknown[]) => mockLaunchCameraAsync(...args),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchImageLibraryAsync(...args),
}));

jest.mock("expo-modules-core", () => ({
  requireOptionalNativeModule: jest.fn(),
}));

jest.mock("../ocr-parser", () => ({
  parsePrescriptionFromOcrText: jest.fn(),
}));

describe("device-ocr", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFileExistsSequence = [];
    mockRequestCameraPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
    });
    mockRequestMediaLibraryPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.GRANTED,
    });
    mockLaunchCameraAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://camera.jpg" }],
    });
    mockLaunchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://gallery.jpg" }],
    });
    mockExtractTextFromImage.mockResolvedValue([
      "서울가정의학과 처방전입니다",
      "타이레놀정 500mg 복용 안내",
    ]);
    mockSaveAsync.mockResolvedValue({ uri: "file://rotated.jpg" });
    mockRenderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
    mockRotate.mockReturnValue({ renderAsync: mockRenderAsync });
    mockManipulate.mockReturnValue({ rotate: mockRotate });
    mockRequireOptionalNativeModule.mockReturnValue({
      isSupported: true,
      extractTextFromImage: mockExtractTextFromImage,
    } as unknown as ReturnType<typeof requireOptionalNativeModule>);
    mockParsePrescriptionFromOcrText.mockReturnValue({
      title: "처방전",
      startDate: "2026-05-01",
      endDate: "2026-05-07",
      medications: [{ atcCode: "A01", drugName: "타이레놀" }],
      rawText: "처방전",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("이미지 URI OCR 추출이 성공하면 draft를 반환한다", async () => {
    const draft = await extractDraftFromImageUri("file://image.jpg");

    expect(mockRequireOptionalNativeModule).toHaveBeenCalledWith("ExpoTextExtractor");
    expect(mockParsePrescriptionFromOcrText).toHaveBeenCalledWith(
      "서울가정의학과 처방전입니다\n타이레놀정 500mg 복용 안내",
    );
    expect(draft.title).toBe("처방전");
  });

  it("정면 인식 결과의 한글이 충분하면 회전을 재시도하지 않는다", async () => {
    await extractDraftFromImageUri("file://image.jpg");

    expect(mockManipulate).not.toHaveBeenCalled();
    expect(mockExtractTextFromImage).toHaveBeenCalledTimes(1);
  });

  it("정면 인식 결과의 한글이 적으면 회전한 이미지로 재시도해 더 나은 결과를 사용한다", async () => {
    mockExtractTextFromImage
      .mockResolvedValueOnce(["ab12"])
      .mockResolvedValueOnce(["서울가정의학과 처방전입니다 타이레놀정 500mg 복용 안내"]);

    await extractDraftFromImageUri("file://image.jpg");

    expect(mockManipulate).toHaveBeenCalledWith("file://image.jpg");
    expect(mockRotate).toHaveBeenCalledWith(90);
    expect(mockExtractTextFromImage).toHaveBeenCalledTimes(2);
    expect(mockParsePrescriptionFromOcrText).toHaveBeenCalledWith(
      "서울가정의학과 처방전입니다 타이레놀정 500mg 복용 안내",
    );
  });

  it("회전 재시도로 만든 임시 이미지는 사용 후 삭제하고 원본은 삭제하지 않는다", async () => {
    mockExtractTextFromImage
      .mockResolvedValueOnce(["ab12"])
      .mockResolvedValueOnce(["서울가정의학과 처방전입니다 타이레놀정 500mg 복용 안내"]);

    await extractDraftFromImageUri("file://image.jpg");

    expect(mockFileDelete).toHaveBeenCalledWith("file://rotated.jpg");
    expect(mockFileDelete).not.toHaveBeenCalledWith("file://image.jpg");
  });

  it("특정 각도 회전이 실패해도 다음 각도로 계속 시도한다", async () => {
    mockExtractTextFromImage
      .mockResolvedValueOnce(["ab12"])
      .mockRejectedValueOnce(new Error("rotate failed"))
      .mockResolvedValueOnce(["서울가정의학과 처방전입니다 타이레놀정 500mg 복용 안내"]);

    const draft = await extractDraftFromImageUri("file://image.jpg");

    expect(mockExtractTextFromImage).toHaveBeenCalledTimes(3);
    expect(mockParsePrescriptionFromOcrText).toHaveBeenCalledWith(
      "서울가정의학과 처방전입니다 타이레놀정 500mg 복용 안내",
    );
    expect(draft.title).toBe("처방전");
  });

  it("모든 각도의 신뢰도가 낮으면 그중 한글이 가장 많이 인식된 결과를 사용한다", async () => {
    mockExtractTextFromImage
      .mockResolvedValueOnce(["가"])
      .mockResolvedValueOnce([""])
      .mockResolvedValueOnce(["가나다"])
      .mockResolvedValueOnce(["가나"]);

    await extractDraftFromImageUri("file://image.jpg");

    expect(mockExtractTextFromImage).toHaveBeenCalledTimes(4);
    expect(mockParsePrescriptionFromOcrText).toHaveBeenCalledWith("가나다");
  });

  it("카메라 권한이 없으면 의미 있는 에러를 던진다", async () => {
    mockRequestCameraPermissionsAsync.mockResolvedValue({
      status: ImagePicker.PermissionStatus.DENIED,
    });

    await expect(extractDraftFromImageSource("camera")).rejects.toThrow(
      "카메라 권한이 필요합니다. 설정에서 카메라 접근을 허용해 주세요.",
    );
  });

  it("갤러리에서 취소하면 null을 반환한다", async () => {
    mockLaunchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });

    const result = await extractDraftFromImageSource("gallery");

    expect(result).toBeNull();
  });

  it("텍스트 추출 모듈이 없으면 개발 빌드 안내 에러를 던진다", async () => {
    mockRequireOptionalNativeModule.mockReturnValue(null);

    await expect(extractDraftFromImageUri("file://image.jpg")).rejects.toThrow(
      "온디바이스 OCR 모듈을 찾을 수 없습니다.",
    );
  });

  it("선택한 이미지 파일을 찾을 수 없으면 재시도 후에도 없으면 안내 에러를 던진다", async () => {
    mockFileExistsSequence = [false, false];

    await expect(extractDraftFromImageUri("file://missing.jpg")).rejects.toThrow(
      "선택한 이미지를 찾을 수 없습니다. 사진을 다시 선택하거나 다시 촬영해 주세요.",
    );
  });

  it("이미지 파일이 재시도 시점에 존재하면 정상적으로 OCR을 진행한다", async () => {
    mockFileExistsSequence = [false, true];

    const draft = await extractDraftFromImageUri("file://delayed.jpg");

    expect(draft.title).toBe("처방전");
  });

  it("Android에서는 file:// 스킴을 제거하고 네이티브 OCR 모듈에 전달한다", async () => {
    jest.replaceProperty(Platform, "OS", "android");

    await extractDraftFromImageUri("file:///data/user/0/com.safemedi/cache/ImagePicker/x.jpeg");

    expect(mockExtractTextFromImage).toHaveBeenCalledWith(
      "/data/user/0/com.safemedi/cache/ImagePicker/x.jpeg",
    );
  });

  it("iOS에서는 file:// 스킴을 유지한 채 네이티브 OCR 모듈에 전달한다", async () => {
    jest.replaceProperty(Platform, "OS", "ios");

    await extractDraftFromImageUri("file:///var/mobile/Containers/x.jpeg");

    expect(mockExtractTextFromImage).toHaveBeenCalledWith("file:///var/mobile/Containers/x.jpeg");
  });

  it("텍스트 추출 미지원 기기면 지원 불가 에러를 던진다", async () => {
    mockRequireOptionalNativeModule.mockReturnValue({
      isSupported: false,
      extractTextFromImage: jest.fn(),
    } as unknown as ReturnType<typeof requireOptionalNativeModule>);

    await expect(extractDraftFromImageUri("file://image.jpg")).rejects.toThrow(
      "이 기기에서는 온디바이스 OCR을 지원하지 않습니다.",
    );
  });
});

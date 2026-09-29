import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";
import { parsePrescriptionFromOcrText } from "./ocr-parser";
import type { ScanPrescriptionDraft } from "./types";

type OcrImageSource = "camera" | "gallery";
interface TextExtractorModule {
  readonly isSupported: boolean;
  readonly extractTextFromImage: (uri: string) => Promise<string[]>;
}

const IMAGE_MEDIA_TYPES: ImagePicker.MediaType[] = ["images"];
const IMAGE_PICKER_QUALITY = 1;
const DEV_BUILD_REQUIRED_MESSAGE =
  "온디바이스 OCR 모듈을 찾을 수 없습니다. Expo Go에서는 동작하지 않으며 개발 빌드(또는 EAS 빌드)로 실행해야 합니다.";
const IMAGE_FILE_MISSING_MESSAGE =
  "선택한 이미지를 찾을 수 없습니다. 사진을 다시 선택하거나 다시 촬영해 주세요.";
const IMAGE_FILE_CHECK_RETRY_DELAY_MS = 400;
const FILE_URI_SCHEME = "file://";
// 정면(0도)에서 인식된 한글 수가 이 값 이상이면 회전 재시도 없이 바로 사용한다.
const CONFIDENT_HANGUL_COUNT = 10;
const ROTATION_RETRY_CANDIDATES_DEG = [90, 180, 270];
const HANGUL_PATTERN = /[가-힣]/g;

function buildPermissionDeniedMessage(source: OcrImageSource): string {
  return source === "camera"
    ? "카메라 권한이 필요합니다. 설정에서 카메라 접근을 허용해 주세요."
    : "갤러리 접근 권한이 필요합니다. 설정에서 사진 접근을 허용해 주세요.";
}

function normalizeUnknownError(error: unknown, fallbackMessage: string): Error {
  return error instanceof Error ? error : new Error(fallbackMessage);
}

function isTextExtractorModule(value: unknown): value is TextExtractorModule {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const moduleCandidate = value as Partial<TextExtractorModule>;
  return (
    typeof moduleCandidate.isSupported === "boolean" &&
    typeof moduleCandidate.extractTextFromImage === "function"
  );
}

async function loadTextExtractorModule(): Promise<TextExtractorModule> {
  const nativeModule = requireOptionalNativeModule<unknown>("ExpoTextExtractor");
  if (!isTextExtractorModule(nativeModule)) {
    throw new Error(DEV_BUILD_REQUIRED_MESSAGE);
  }
  return nativeModule;
}

function ensureTextExtractorSupported(module: TextExtractorModule): void {
  if (!module.isSupported) {
    throw new Error("이 기기에서는 온디바이스 OCR을 지원하지 않습니다.");
  }
}

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

async function ensureImageFileExists(uri: string): Promise<void> {
  if (new File(uri).exists) {
    return;
  }
  await wait(IMAGE_FILE_CHECK_RETRY_DELAY_MS);
  if (!new File(uri).exists) {
    throw new Error(IMAGE_FILE_MISSING_MESSAGE);
  }
}

// expo-text-extractor의 Android 구현은 file:// 스킴을 벗기지 않고 그대로
// java.io.File(String)에 넘겨서 항상 파일을 찾지 못한다. iOS는 반대로 URL
// 파싱을 위해 스킴이 있어야 하므로 Android에서만 스킴을 제거해 전달한다.
function toTextExtractorUri(uri: string): string {
  if (Platform.OS === "android" && uri.startsWith(FILE_URI_SCHEME)) {
    return uri.slice(FILE_URI_SCHEME.length);
  }
  return uri;
}

function countHangulCharacters(rawText: string): number {
  return (rawText.match(HANGUL_PATTERN) ?? []).length;
}

async function rotateImage(uri: string, degrees: number): Promise<string> {
  const rendered = await ImageManipulator.manipulate(uri).rotate(degrees).renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG });
  return saved.uri;
}

function deleteFileQuietly(uri: string): void {
  try {
    new File(uri).delete();
  } catch {
    // 임시 회전 이미지 정리 실패는 OCR 결과에 영향이 없으므로 무시한다.
  }
}

async function extractRawTextAtRotation(
  textExtractorModule: TextExtractorModule,
  imageUri: string,
  degrees: number,
): Promise<string> {
  if (degrees === 0) {
    const extractedTexts = await textExtractorModule.extractTextFromImage(
      toTextExtractorUri(imageUri),
    );
    return extractedTexts.join("\n");
  }

  const rotatedUri = await rotateImage(imageUri, degrees);
  try {
    const extractedTexts = await textExtractorModule.extractTextFromImage(
      toTextExtractorUri(rotatedUri),
    );
    return extractedTexts.join("\n");
  } finally {
    deleteFileQuietly(rotatedUri);
  }
}

// 문서 자체가 기울어진 채 촬영되면 인식률이 크게 떨어지므로, 정면 결과의 한글
// 인식량이 적을 때만 90/180/270도로 재시도해 가장 결과가 좋은 쪽을 사용한다.
async function extractBestRawText(
  textExtractorModule: TextExtractorModule,
  imageUri: string,
): Promise<string> {
  const initialText = await extractRawTextAtRotation(textExtractorModule, imageUri, 0);
  if (countHangulCharacters(initialText) >= CONFIDENT_HANGUL_COUNT) {
    return initialText;
  }

  let bestText = initialText;
  let bestScore = countHangulCharacters(initialText);
  for (const degrees of ROTATION_RETRY_CANDIDATES_DEG) {
    try {
      const candidateText = await extractRawTextAtRotation(textExtractorModule, imageUri, degrees);
      const candidateScore = countHangulCharacters(candidateText);
      if (candidateScore > bestScore) {
        bestText = candidateText;
        bestScore = candidateScore;
      }
      if (bestScore >= CONFIDENT_HANGUL_COUNT) {
        break;
      }
    } catch {
      // 특정 각도에서 실패해도 다른 각도 결과로 계속 진행한다.
    }
  }
  return bestText;
}

async function requestPermission(source: OcrImageSource): Promise<void> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
    throw new Error(buildPermissionDeniedMessage(source));
  }
}

async function pickImageUri(source: OcrImageSource): Promise<string | null> {
  await requestPermission(source);

  const pickerResult =
    source === "camera"
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: IMAGE_MEDIA_TYPES,
          quality: IMAGE_PICKER_QUALITY,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: IMAGE_MEDIA_TYPES,
          quality: IMAGE_PICKER_QUALITY,
          allowsMultipleSelection: false,
        });

  if (pickerResult.canceled) {
    return null;
  }

  const imageUri = pickerResult.assets[0]?.uri;
  if (!imageUri) {
    throw new Error("이미지 경로를 불러오지 못했습니다. 다시 시도해 주세요.");
  }
  return imageUri;
}

export async function extractDraftFromImageUri(imageUri: string): Promise<ScanPrescriptionDraft> {
  const textExtractorModule = await loadTextExtractorModule();
  ensureTextExtractorSupported(textExtractorModule);
  await ensureImageFileExists(imageUri);
  try {
    const rawText = await extractBestRawText(textExtractorModule, imageUri);
    return parsePrescriptionFromOcrText(rawText);
  } catch (error) {
    throw normalizeUnknownError(error, "OCR 텍스트 추출 중 오류가 발생했습니다.");
  }
}

export async function extractDraftFromImageSource(source: OcrImageSource): Promise<{
  readonly imageUri: string;
  readonly draft: ScanPrescriptionDraft;
} | null> {
  const imageUri = await pickImageUri(source);
  if (!imageUri) {
    return null;
  }
  const draft = await extractDraftFromImageUri(imageUri);
  return { imageUri, draft };
}

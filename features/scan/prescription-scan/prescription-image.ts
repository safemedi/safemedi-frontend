import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export async function pickPrescriptionImage(source: "camera" | "gallery"): Promise<string | null> {
  const permission =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (permission.status !== ImagePicker.PermissionStatus.GRANTED) {
    throw new Error(
      source === "camera" ? "카메라 접근 권한이 필요합니다." : "사진 접근 권한이 필요합니다.",
    );
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 1,
    allowsMultipleSelection: false,
  };
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) throw new Error("선택한 사진을 불러오지 못했습니다.");
  // HEIC 등 기기별 형식을 JPEG로 통일하며 과도한 해상도만 줄인다.
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 2400) {
    context.resize(asset.width >= asset.height ? { width: 2400 } : { height: 2400 });
  }
  const rendered = await context.renderAsync();
  try {
    return (await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 })).uri;
  } finally {
    rendered.release();
    context.release();
  }
}

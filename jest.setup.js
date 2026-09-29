try {
  require("@tamagui/native/setup-zeego");
} catch {
  // 테스트 환경에서 패키지가 없거나 불필요할 수 있습니다.
}

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@expo/vector-icons/Ionicons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MockIonicons(props) {
    return React.createElement(
      Text,
      { accessibilityLabel: `icon-${props?.name ?? "unknown"}` },
      "",
    );
  };
});

const originalWarn = console.warn;
jest.spyOn(console, "warn").mockImplementation((...args) => {
  if (typeof args[0] === "string" && args[0].includes("setup-zeego")) {
    return;
  }
  originalWarn(...args);
});

const originalError = console.error;
jest.spyOn(console, "error").mockImplementation((...args) => {
  if (typeof args[0] === "string" && args[0].includes("setup-zeego")) {
    return;
  }
  originalError(...args);
});

const { dependencies } = require("../react-native.config");

it.each([
  "@react-native-firebase/app",
  "@react-native-firebase/messaging",
])("%s의 자동 연결을 Android에서만 비활성화한다", (name) => {
  expect(dependencies[name].platforms.android).toBeNull();
  expect(dependencies[name].platforms.ios).toBeUndefined();
});

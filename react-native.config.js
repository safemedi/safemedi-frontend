// Android는 기존 expo-notifications FCM 구현을 유지한다.
module.exports = {
  dependencies: {
    "@react-native-firebase/app": { platforms: { android: null } },
    "@react-native-firebase/messaging": { platforms: { android: null } },
  },
};

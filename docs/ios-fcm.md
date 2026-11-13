# iOS FCM 로컬 테스트

## 구성

- iOS Bundle ID: `com.safemedi`
- Firebase 프로젝트는 기존 Android/백엔드와 동일한 프로젝트를 사용한다.
- `GOOGLE_SERVICES_PLIST` 환경변수에 Firebase iOS 설정 파일의 로컬 경로를 지정한다.
  `GoogleService-Info*.plist`는 Git에서 제외한다.
- APNs `.p8` 키는 Firebase 콘솔에만 등록하며 앱이나 저장소에 넣지 않는다.
- iOS는 React Native Firebase 23.8.8의 권한·FCM 토큰·수신 처리를 사용한다.
- Android는 기존 expo-notifications 경로를 유지한다. RN Firebase의 Android 자동 연결은 제외한다.
- iOS에서는 중복 알림 처리를 피하기 위해 expo-notifications 자동 연결을 제외한다.
- 이전 `EXPO_PUBLIC_IOS_ENABLE_REMOTE_PUSH` 플래그는 더 이상 사용하지 않는다.

## 개발 환경과 검증 범위

현재 Expo 54 / React Native 0.81 구성이다. Xcode 26 환경에서 테스트한다.
Xcode 27의 UIScene 지원을 위한 SDK 업그레이드는 포함하지 않는다.
단위 테스트와 빌드 검증은 실제 iPhone의 로그인·FCM 수신 검증과 구분한다.
현재 구성에서 실기기 로그인부터 알림 수신까지의 검증은 아직 완료하지 않았다.

## 새 앱 빌드

이번 변경은 네이티브 모듈을 추가하므로 Metro 재시작만으로 적용되지 않는다.

```bash
npx expo prebuild --platform ios --no-install
cd ios
pod install
cd ..
open ios/safeMedi.xcworkspace
```

Xcode의 safeMedi target에서 자동 서명과 유료 Team을 확인하고 연결한 iPhone을 선택한다.
iPhone 개발자 모드와 기기 등록이 필요하다. `yarn dev`를 실행한 뒤 Xcode에서 Run한다.
기존 개발 앱에 모듈 누락 오류가 남으면 이전 앱을 삭제한 뒤 새 빌드를 설치한다.

## 확인 순서

1. 앱 로그인 후 알림 권한을 허용한다. 권한을 이미 거부했다면 iPhone 설정에서 허용한 뒤 앱을 재실행한다.
2. 서버의 기존 디바이스 토큰 등록 API가 `deviceType: IOS`로 성공하는지 확인한다.
   이때 전송되는 값은 APNs 토큰이 아닌 FCM 토큰이다. 토큰 원문은 로그로 출력하지 않는다.
3. 앱의 복약 알림 설정을 켜고 가까운 시간의 복약 일정을 등록해 기존 서버 발송 경로로 테스트한다.
4. 앱을 열어둔 상태에서 알림 표시와 알림/대시보드 갱신을 확인한다.
5. 홈 화면으로 이동한 상태에서도 알림이 표시되는지 확인하고 알림을 눌러 앱을 연다.
6. 앱이 실행되지 않은 상태에서도 알림 표시와 알림을 통한 앱 실행을 확인한다.
7. 로그아웃 후 서버 토큰 연결이 해제되는지 확인한다.

FCM 토큰 갱신 시 재등록하며, 이전 토큰 정리는 기존 토큰 수명주기 처리를 재사용한다.
알림 터치는 현재 화면을 유지하며 알림 및 대시보드 쿼리를 갱신한다.
특정 상세 화면으로 이동하는 기능은 포함하지 않는다.

Xcode Debug 빌드는 Firebase의 Sandbox APNs 키가 필요하다.
TestFlight/App Store 빌드는 Production APNs 키가 필요하다.
현재 서버가 전송하는 notification(title/body) 메시지가 테스트 대상이며,
data-only 백그라운드 작업 실행은 이 변경의 범위에 포함하지 않는다.

키·토큰이 맞아도 iPhone의 집중 모드/알림 설정에 따라 표시가 제한될 수 있다.
로컬 컴파일과 단위 테스트만으로 실제 APNs 전달 성공을 보장할 수 없으므로 위 실기기 검증을 진행한다.

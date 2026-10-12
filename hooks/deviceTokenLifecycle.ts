let pendingOperation: Promise<unknown> = Promise.resolve();

/** 등록 응답이 로그아웃의 토큰 해제보다 늦게 도착해 푸시 연결을 되살리지 않도록 직렬화한다. */
export function runDeviceTokenOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = pendingOperation.then(operation);
  pendingOperation = result.catch(() => {});
  return result;
}

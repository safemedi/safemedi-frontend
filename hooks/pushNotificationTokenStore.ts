let registeredDeviceToken: string | null = null;

export function getRegisteredDeviceToken(): string | null {
  return registeredDeviceToken;
}

export function setRegisteredDeviceToken(token: string | null): void {
  registeredDeviceToken = token;
}

export function clearRegisteredDeviceToken(): void {
  registeredDeviceToken = null;
}

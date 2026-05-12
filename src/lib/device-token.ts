export const DEVICE_TOKEN_KEY = "device_token";

export function getDeviceToken() {
  return window.localStorage.getItem(DEVICE_TOKEN_KEY);
}

export function getOrCreateDeviceToken() {
  const storedToken = getDeviceToken();

  if (storedToken) {
    return storedToken;
  }

  const token =
    window.crypto?.randomUUID() ??
    `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  window.localStorage.setItem(DEVICE_TOKEN_KEY, token);

  return token;
}

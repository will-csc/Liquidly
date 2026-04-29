const AUTH_USER_KEY = "user";
const AUTH_TOKEN_KEY = "token";

const readStorage = (storage: Storage, key: string) => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const removeStorageKey = (storage: Storage, key: string) => {
  try {
    storage.removeItem(key);
  } catch {
    void 0;
  }
};

export const clearPersistentAuth = () => {
  removeStorageKey(localStorage, AUTH_USER_KEY);
  removeStorageKey(localStorage, AUTH_TOKEN_KEY);
};

export const clearAuthSession = () => {
  clearPersistentAuth();
  removeStorageKey(sessionStorage, AUTH_USER_KEY);
  removeStorageKey(sessionStorage, AUTH_TOKEN_KEY);
};

export const storeSessionAuth = (user: unknown, token: string) => {
  const tokenValue = token.trim();
  if (!tokenValue) return false;

  try {
    clearPersistentAuth();
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user ?? null));
    sessionStorage.setItem(AUTH_TOKEN_KEY, tokenValue);
    return true;
  } catch {
    return false;
  }
};

export const readSessionToken = () => {
  const token = readStorage(sessionStorage, AUTH_TOKEN_KEY);
  return token && token.trim().length > 0 ? token : "";
};

export const hasActiveSession = () => readSessionToken().length > 0;

export const readSessionUser = <T = unknown>() => {
  const raw = readStorage(sessionStorage, AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

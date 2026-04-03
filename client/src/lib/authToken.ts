const ACCESS_TOKEN_KEY = 'accessToken';

const canUseStorage = () => typeof window !== 'undefined';

export const getAccessToken = (): string | null => {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token: string) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = () => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
};

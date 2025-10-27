// src/utils/auth.js
const ACCESS_KEY = "access_token_v1";
let accessTokenMemory = sessionStorage.getItem(ACCESS_KEY) || null;

export const setAccessToken = (t) => {
  accessTokenMemory = t || null;
  if (t) sessionStorage.setItem(ACCESS_KEY, t);
  else sessionStorage.removeItem(ACCESS_KEY);
};

export const getAccessToken = () => {
  if (!accessTokenMemory) {
    accessTokenMemory = sessionStorage.getItem(ACCESS_KEY) || null;
  }
  return accessTokenMemory;
};

export const clearAccessToken = () => {
  accessTokenMemory = null;
  sessionStorage.removeItem(ACCESS_KEY);
};

let accessTokenMemory = sessionStorage.getItem("access_token") || null;

export const setAccessToken = (t) => {
  accessTokenMemory = t || null;
  if (t) sessionStorage.setItem("access_token", t);
  else sessionStorage.removeItem("access_token");
};

export const getAccessToken = () =>
  accessTokenMemory ?? sessionStorage.getItem("access_token");

export const clearAccessToken = () => {
  accessTokenMemory = null;
  sessionStorage.removeItem("access_token");
};

export const logout = () => {
  clearAccessToken();
};

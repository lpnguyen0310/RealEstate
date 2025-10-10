let accessTokenMemory = null;

export const setAccessToken = (t) => {
  accessTokenMemory = t;
  sessionStorage.setItem("access_token", t);
};
export const getAccessToken = () =>
  accessTokenMemory ?? sessionStorage.getItem("access_token");
export const clearAccessToken = () => {
  accessTokenMemory = null;
  sessionStorage.removeItem("access_token");
};
export const logout = () => {
  clearAccessToken();
  window.location.href = "/login";
};

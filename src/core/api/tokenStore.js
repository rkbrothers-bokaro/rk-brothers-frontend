let accessToken = sessionStorage.getItem("accessToken") || null;
let refreshToken = sessionStorage.getItem("refreshToken") || null;
let logoutHandler = () => {};

export function setTokens({ accessToken: at, refreshToken: rt }) {
  accessToken = at;
  refreshToken = rt;
  sessionStorage.setItem("accessToken", at);
  sessionStorage.setItem("refreshToken", rt);
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("refreshToken");
}

export function setLogoutHandler(fn) {
  logoutHandler = fn;
}

export function triggerLogout() {
  logoutHandler();
}

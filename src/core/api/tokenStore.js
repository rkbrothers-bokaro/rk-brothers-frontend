let accessToken = null;
let refreshToken = null;
let logoutHandler = () => {};

export function setTokens({ accessToken: at, refreshToken: rt }) {
  accessToken = at;
  refreshToken = rt;
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
}

export function setLogoutHandler(fn) {
  logoutHandler = fn;
}

export function triggerLogout() {
  logoutHandler();
}

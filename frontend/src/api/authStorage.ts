const TOKEN_KEY = "smart_scheduler_token";

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

function decodeJwtPayload(token: string) {
  const payload = token.split(".")[1];

  return JSON.parse(atob(payload));
}

export function getCurrentUserEmail() {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const payload = decodeJwtPayload(token);

    return payload.email || null;
  } catch {
    return null;
  }
}

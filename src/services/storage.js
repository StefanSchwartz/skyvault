// LocalStorage persistence helpers for SkyVault

const SESSION_KEY = 'skyvault_session';
const CUSTOM_TAGS_KEY = 'skyvault_custom_tags';
const APP_PASSWORD_HINT_KEY = 'skyvault_handle_remember';

export function saveSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to load session from localStorage', e);
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Failed to clear session from localStorage', e);
  }
}

export function saveCustomTags(tagsMap) {
  try {
    localStorage.setItem(CUSTOM_TAGS_KEY, JSON.stringify(tagsMap));
  } catch (e) {
    console.error('Failed to save custom tags', e);
  }
}

export function loadCustomTags() {
  try {
    const raw = localStorage.getItem(CUSTOM_TAGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to load custom tags', e);
    return {};
  }
}

export function rememberHandle(handle) {
  if (handle) {
    localStorage.setItem(APP_PASSWORD_HINT_KEY, handle);
  }
}

export function getRememberedHandle() {
  return localStorage.getItem(APP_PASSWORD_HINT_KEY) || '';
}

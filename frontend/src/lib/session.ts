const SESSION_KEY_STORAGE = "booth_session_key";

export function getSessionKey(): string {
  let key = localStorage.getItem(SESSION_KEY_STORAGE);
  if (!key) {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    key = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(SESSION_KEY_STORAGE, key);
  }
  return key;
}

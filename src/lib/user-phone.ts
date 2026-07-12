const KEY = "mealbae.phone.v1";

export function getSavedPhone(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function savePhone(phone: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, phone.trim());
  } catch {
    /* noop */
  }
}

export function clearSavedPhone() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

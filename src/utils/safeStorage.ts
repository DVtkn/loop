// Safe storage utility for environments where localStorage might be restricted or throw SecurityError

const memoryStore = new Map<string, string>();

export function safeGetStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item) as T;
      }
    }
  } catch (err) {
    // In restricted iframe or private mode where localStorage throws
    const memItem = memoryStore.get(key);
    if (memItem !== undefined) {
      try {
        return JSON.parse(memItem) as T;
      } catch {
        return fallback;
      }
    }
  }
  return fallback;
}

export function safeSetStorage<T>(key: string, value: T): void {
  try {
    const stringified = JSON.stringify(value);
    memoryStore.set(key, stringified);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, stringified);
    }
  } catch (err) {
    // Ignore localStorage write error (e.g. quota or security restriction)
  }
}

export function safeRemoveStorage(key: string): void {
  try {
    memoryStore.delete(key);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    // Ignore
  }
}

export function getCurrentStorageUserLogin(): string {
  const user = safeGetStorage<{ login?: string } | null>('together_current_user', null);
  return user?.login ? String(user.login).toLowerCase().trim().replace(/^@/, '') : '';
}

export function getUserStorageKey(baseKey: string, login?: string | null): string {
  const clean = (login ?? getCurrentStorageUserLogin()).toLowerCase().trim().replace(/^@/, '');
  return clean ? `${baseKey}_${clean}` : `${baseKey}_guest`;
}

export function isIOSDevice(): boolean {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    const userAgent = (navigator.userAgent || '').toLowerCase();
    const platform = (navigator.platform || '');
    const maxTouchPoints = (navigator.maxTouchPoints || 0);
    return (
      /iphone|ipad|ipod/.test(userAgent) ||
      (platform === 'MacIntel' && maxTouchPoints > 1)
    );
  } catch {
    return false;
  }
}

export function isStandaloneApp(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (window.navigator && 'standalone' in window.navigator && (window.navigator as any).standalone === true) {
      return true;
    }
    if (typeof window.matchMedia === 'function') {
      const match = window.matchMedia('(display-mode: standalone)');
      if (match && match.matches) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

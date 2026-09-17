export const ACTIVE_CHILD_KEY = "bb-child";
export const USERS_KEY = "bb-users";
export const SESSION_KEY = "bb-session";
export const CURRENT_USER_KEY = "bb-user";

export type StoredLocalUser = {
  email: string;
  name: string;
  userId?: string;
  onboardingComplete?: boolean;
  hasPaid?: boolean;
  activeChildId?: string | null;
  lastSeenAt: string;
};

type UsersMap = Record<string, StoredLocalUser>;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

let storageOverride: StorageLike | null = null;

export function bindLocalUserStorage(storage: StorageLike | null) {
  storageOverride = storage;
}

function memory(): StorageLike | null {
  if (storageOverride) return storageOverride;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string, fallback: T): T {
  const store = memory();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  const store = memory();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

function removeKey(key: string) {
  const store = memory();
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    /* private mode */
  }
}

export function normalizeUserEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function readLocalUsers(): UsersMap {
  const users = readJson<UsersMap>(USERS_KEY, {});
  return users && typeof users === "object" ? users : {};
}

export function readSessionEmail(): string | null {
  const store = memory();
  if (!store) return null;
  try {
    const value = store.getItem(SESSION_KEY);
    return value ? normalizeUserEmail(value) : null;
  } catch {
    return null;
  }
}

export function readCurrentLocalUser(): StoredLocalUser | null {
  const fromCurrent = readJson<StoredLocalUser | null>(CURRENT_USER_KEY, null);
  if (fromCurrent?.email) return fromCurrent;
  const email = readSessionEmail();
  if (!email) return null;
  return readLocalUsers()[email] ?? null;
}

function persistUsers(users: UsersMap) {
  writeJson(USERS_KEY, users);
}

/** Create or update one record per email. Never inserts a second user for the same email. */
export function rememberLocalUser(
  input: {
    email: string;
    name?: string;
    userId?: string;
    onboardingComplete?: boolean;
    hasPaid?: boolean;
    activeChildId?: string | null;
  }
): { user: StoredLocalUser; created: boolean } {
  const email = normalizeUserEmail(input.email);
  if (!email) {
    throw new Error("Email is required");
  }

  const users = readLocalUsers();
  const existing = users[email];
  const created = !existing;
  const user: StoredLocalUser = {
    email,
    name: input.name?.trim() || existing?.name || "Parent",
    userId: input.userId ?? existing?.userId,
    onboardingComplete: input.onboardingComplete ?? existing?.onboardingComplete,
    hasPaid: input.hasPaid ?? existing?.hasPaid,
    activeChildId:
      input.activeChildId !== undefined ? input.activeChildId : existing?.activeChildId ?? null,
    lastSeenAt: new Date().toISOString(),
  };

  users[email] = user;
  persistUsers(users);
  writeJson(CURRENT_USER_KEY, user);

  const store = memory();
  try {
    store?.setItem(SESSION_KEY, email);
  } catch {
    /* private mode */
  }

  if (user.activeChildId) {
    try {
      store?.setItem(ACTIVE_CHILD_KEY, user.activeChildId);
    } catch {
      /* private mode */
    }
  }

  return { user, created };
}

export function patchCurrentLocalUser(patch: Partial<Omit<StoredLocalUser, "email">>) {
  const email = readSessionEmail();
  if (!email) return null;
  return rememberLocalUser({ email, ...patch }).user;
}

export function rememberActiveChildId(childId: string) {
  if (!readSessionEmail()) return;
  const store = memory();
  try {
    store?.setItem(ACTIVE_CHILD_KEY, childId);
  } catch {
    /* private mode */
  }
  patchCurrentLocalUser({ activeChildId: childId });
}

/**
 * Logout: drop the live session snapshot.
 * Keep bb-users so the same email is recognised on the next login (no duplicate).
 */
export function endLocalSession() {
  const email = readSessionEmail();
  if (email) {
    const child = memory()?.getItem(ACTIVE_CHILD_KEY);
    if (child) {
      const users = readLocalUsers();
      if (users[email]) {
        users[email] = { ...users[email], activeChildId: child, lastSeenAt: new Date().toISOString() };
        persistUsers(users);
      }
    }
  }

  removeKey(SESSION_KEY);
  removeKey(CURRENT_USER_KEY);
  removeKey(ACTIVE_CHILD_KEY);
}

export function countLocalUsers(): number {
  return Object.keys(readLocalUsers()).length;
}

export function localUserCountForEmail(email: string): number {
  const key = normalizeUserEmail(email);
  return readLocalUsers()[key] ? 1 : 0;
}

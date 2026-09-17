import { afterEach, describe, expect, it } from "vitest";
import {
  bindLocalUserStorage,
  countLocalUsers,
  endLocalSession,
  localUserCountForEmail,
  readCurrentLocalUser,
  readLocalUsers,
  readSessionEmail,
  rememberLocalUser,
  rememberActiveChildId,
  ACTIVE_CHILD_KEY,
  CURRENT_USER_KEY,
  SESSION_KEY,
} from "@/lib/local-user-store";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

describe("local user store", () => {
  afterEach(() => {
    bindLocalUserStorage(null);
  });

  it("creates one record the first time an email signs in", () => {
    bindLocalUserStorage(memoryStorage());
    const first = rememberLocalUser({
      email: "mother.dev@example.com",
      name: "Dev Mother",
      userId: "user-1",
    });
    expect(first.created).toBe(true);
    expect(countLocalUsers()).toBe(1);
    expect(readSessionEmail()).toBe("mother.dev@example.com");
    expect(readCurrentLocalUser()?.name).toBe("Dev Mother");
  });

  it("loads the same email instead of creating a duplicate", () => {
    bindLocalUserStorage(memoryStorage());
    rememberLocalUser({ email: "Mother.Dev@example.com", name: "Dev Mother", activeChildId: "child-a" });
    const again = rememberLocalUser({
      email: "mother.dev@example.com",
      name: "Dev Mother",
      hasPaid: true,
    });
    expect(again.created).toBe(false);
    expect(countLocalUsers()).toBe(1);
    expect(localUserCountForEmail("MOTHER.DEV@EXAMPLE.COM")).toBe(1);
    expect(again.user.activeChildId).toBe("child-a");
    expect(again.user.hasPaid).toBe(true);
    expect(Object.keys(readLocalUsers())).toEqual(["mother.dev@example.com"]);
  });

  it("clears the live session on logout but keeps the email for the next login", () => {
    const store = memoryStorage();
    bindLocalUserStorage(store);
    rememberLocalUser({ email: "mother.dev@example.com", name: "Dev Mother", activeChildId: "child-a" });
    rememberActiveChildId("child-a");
    endLocalSession();

    expect(readSessionEmail()).toBeNull();
    expect(readCurrentLocalUser()).toBeNull();
    expect(store.getItem(SESSION_KEY)).toBeNull();
    expect(store.getItem(CURRENT_USER_KEY)).toBeNull();
    expect(store.getItem(ACTIVE_CHILD_KEY)).toBeNull();
    expect(countLocalUsers()).toBe(1);
    expect(readLocalUsers()["mother.dev@example.com"].activeChildId).toBe("child-a");

    const again = rememberLocalUser({ email: "mother.dev@example.com" });
    expect(again.created).toBe(false);
    expect(again.user.activeChildId).toBe("child-a");
    expect(store.getItem(ACTIVE_CHILD_KEY)).toBe("child-a");
  });

  it("does not restore the active child after logout when no session remains", () => {
    const store = memoryStorage();
    bindLocalUserStorage(store);
    rememberLocalUser({ email: "mother.dev@example.com", activeChildId: "child-a" });
    endLocalSession();
    rememberActiveChildId("child-a");
    expect(store.getItem(ACTIVE_CHILD_KEY)).toBeNull();
  });

  it("never writes a password into localStorage", () => {
    const store = memoryStorage();
    bindLocalUserStorage(store);
    rememberLocalUser({ email: "mother.dev@example.com", name: "Dev Mother" });
    const dumped = JSON.stringify({
      users: store.getItem("bb-users"),
      session: store.getItem("bb-session"),
      current: store.getItem("bb-user"),
    }).toLowerCase();
    expect(dumped).not.toContain("password");
    expect(dumped).not.toContain("kitchen159");
  });
});

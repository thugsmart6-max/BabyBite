/**
 * Shared cache with in-process fallback. User-specific keys MUST include userId.
 */

type Entry = { value: string; expiresAt: number };

const memory = new Map<string, Entry>();

export async function cacheGet(key: string): Promise<string | null> {
  const hit = memory.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memory.delete(key);
    return null;
  }
  return hit.value;
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  memory.delete(key);
}

export function mealPlanCacheKey(userId: string, childProfileId: string): string {
  return `mealplan:user:${userId}:${childProfileId}`;
}

export function userTodayCacheKey(userId: string, childProfileId: string): string {
  return `user:${userId}:today:${childProfileId}`;
}

export function userWeekCacheKey(userId: string, childProfileId: string): string {
  return `user:${userId}:week:${childProfileId}`;
}

export function userCalendarDayCacheKey(userId: string, childProfileId: string, dayDate: string): string {
  return `user:${userId}:calendar:${childProfileId}:${dayDate}`;
}

/** Drop cached plan slices after lunch swap or preference change. */
export async function invalidateUserMealViews(
  userId: string,
  childProfileId: string,
  dayDate?: string
): Promise<void> {
  await cacheDel(mealPlanCacheKey(userId, childProfileId));
  await cacheDel(userTodayCacheKey(userId, childProfileId));
  await cacheDel(userWeekCacheKey(userId, childProfileId));
  if (dayDate) {
    await cacheDel(userCalendarDayCacheKey(userId, childProfileId, dayDate));
  }
}

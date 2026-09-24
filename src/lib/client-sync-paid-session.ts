type SessionUpdate = (data?: { hasPaid?: boolean }) => Promise<unknown>;

/** JWT in middleware can lag Mongo after checkout; align session with the child profile. */
export async function ensureSessionReflectsPaid(
  update: SessionUpdate,
  childHasPaid: boolean,
  sessionHasPaid: boolean
): Promise<void> {
  if (childHasPaid && !sessionHasPaid) {
    await update({ hasPaid: true });
  }
}

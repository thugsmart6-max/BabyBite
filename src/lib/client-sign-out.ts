import { signOut } from "next-auth/react";

/** Stay on the current host (avoids production redirect to localhost from mis-set AUTH_URL). */
export async function signOutToLanding() {
  await signOut({ redirect: false });
  window.location.assign("/landing");
}

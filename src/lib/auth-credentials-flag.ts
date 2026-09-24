/** Email/password auth is off in production; enable for Playwright via env. */
export function credentialsAuthEnabled(): boolean {
  return process.env.ALLOW_CREDENTIALS_AUTH === "true";
}

export function showCredentialsAuthUi(): boolean {
  return process.env.NEXT_PUBLIC_ALLOW_CREDENTIALS_AUTH === "true";
}

import type { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";

const { GET: authGet, POST: authPost } = handlers;

export async function GET(request: NextRequest) {
  // #region agent log
  fetch("http://127.0.0.1:7803/ingest/95f350a3-7db0-463e-a25d-1bd09a11d00d", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "422235" },
    body: JSON.stringify({
      sessionId: "422235",
      location: "src/app/api/auth/[...nextauth]/route.ts:GET",
      message: "nextauth route hit",
      data: { path: new URL(request.url).pathname },
      timestamp: Date.now(),
      hypothesisId: "A",
      runId: "post-fix",
    }),
  }).catch(() => {});
  // #endregion
  return authGet(request);
}

export async function POST(request: NextRequest) {
  return authPost(request);
}

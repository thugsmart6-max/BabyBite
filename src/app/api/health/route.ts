import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get("deep") === "1";
  const payload: Record<string, unknown> = {
    ok: true,
    service: "babybite",
    ts: new Date().toISOString(),
  };

  if (deep) {
    try {
      await connectDB();
      payload.db = "ok";
    } catch {
      return NextResponse.json({ ...payload, ok: false, db: "error" }, { status: 503 });
    }
  }

  return NextResponse.json(payload);
}

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import type { ZodError } from "zod";
import { isMongoSrvError } from "@/lib/mongodb-srv";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isMongoObjectId(id: string | undefined | null): id is string {
  return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id) && mongoose.Types.ObjectId.isValid(id);
}

export function mongoIdSchemaMessage(label = "id"): string {
  return `Invalid ${label}`;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function zodErrorResponse(error: ZodError) {
  return jsonError(error.issues[0]?.message ?? "Invalid data", 400);
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof Error && error.message === "Unauthorized";
}

export function handleRouteError(error: unknown, fallback: string) {
  if (isUnauthorizedError(error)) {
    return jsonError("Please sign in", 401);
  }
  if (error instanceof ApiError) {
    return jsonError(error.message, error.status);
  }
  if (isMongoSrvError(error)) {
    return jsonError(
      "Database connection timed out. Check your network or MongoDB Atlas access.",
      503
    );
  }
  console.error(fallback, error);
  return jsonError(fallback, 500);
}

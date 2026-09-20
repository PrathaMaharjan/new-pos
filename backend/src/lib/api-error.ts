import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { UnauthenticatedError, NoLocationSelectedError } from "@/middleware/auth.middleware";
import { RateLimitError } from "@/lib/rate-limit";
import { ZodError } from "zod";
import { AuthError } from "@/core/auth/authServices";

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof NoLocationSelectedError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
    );
  }
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: error.issues },
      { status: 400 },
    );
  }

  const requestId = randomUUID();
  console.error(`[unhandled-error] request_id=${requestId}`, error);
  return NextResponse.json({ error: "Internal server error", requestId }, { status: 500 });
}
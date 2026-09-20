import { NextRequest } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "@/core/auth/token.service";
import { getAccessCookie } from "@/lib/validation/src/cookies";

export class UnauthenticatedError extends Error {}
export class NoLocationSelectedError extends Error {
  constructor() {
    super("A location must be selected before performing this action");
  }
}

export function requireSession(request: NextRequest): AccessTokenPayload {
  const token = getAccessCookie(request);

  if (!token) throw new UnauthenticatedError("Missing access token");

  try {
    return verifyAccessToken(token);
  } catch {
    throw new UnauthenticatedError("Invalid or expired access token");
  }
}

export function requireLocation(session: AccessTokenPayload): string {
  if (!session.locationId) throw new NoLocationSelectedError();
  return session.locationId;
}
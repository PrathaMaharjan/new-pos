import { NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

const ACCESS_COOKIE_MAX_AGE_SECONDS = 15 * 60;
const REFRESH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };
}

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  response.cookies.set(ACCESS_COOKIE_NAME, tokens.accessToken, {
    ...baseCookieOptions(),
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...baseCookieOptions(),
    path: "/api/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE_NAME, "", { ...baseCookieOptions(), path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    ...baseCookieOptions(),
    path: "/api/auth",
    maxAge: 0,
  });
}

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function getAccessCookie(request: Request): string | null {
  return readCookie(request, ACCESS_COOKIE_NAME);
}

export function getRefreshCookie(request: Request): string | null {
  return readCookie(request, REFRESH_COOKIE_NAME);
}
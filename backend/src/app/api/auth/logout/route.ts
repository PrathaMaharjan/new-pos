import { logout } from "@/core/auth/authServices";
import { handleApiError } from "@/lib/api-error";
import { clearAuthCookies, getRefreshCookie } from "@/lib/validation/src/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const rawRefreshToken = getRefreshCookie(request);
    if (rawRefreshToken) {
      await logout(rawRefreshToken);
    }

    const response = NextResponse.json({ loggedOut: true });
    clearAuthCookies(response);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
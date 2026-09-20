import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { AuthError, refresh } from "@/core/auth/authServices";
import { getRefreshCookie, setAuthCookies } from "@/lib/validation/src/cookies";

export async function POST(request: NextRequest) {
  try {
    const rawRefreshToken = getRefreshCookie(request);
    if (!rawRefreshToken) throw new AuthError("No refresh token provided");

    const { accessToken, refreshToken: newRefreshToken } = await refresh(rawRefreshToken);

    const response = NextResponse.json({ refreshed: true });
    setAuthCookies(response, { accessToken, refreshToken: newRefreshToken });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
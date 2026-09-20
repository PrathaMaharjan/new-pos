import { login } from "@/core/auth/authServices";
import { handleApiError } from "@/lib/api-error";
import { checkRateLimit, rateLimitKeyForIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/src/auth";
import { setAuthCookies } from "@/lib/validation/src/cookies";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await checkRateLimit(rateLimitKeyForIp(request, "login"), 20, 60 * 15);

    const body = await request.json();
    const input = loginSchema.parse(body);
    const { user, accessToken, refreshToken, locations, needsLocationSelection, tenant, role } =
      await login(input);

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
      locations: locations.map((l: any) => ({ id: l.id, name: l.name })),
      needsLocationSelection,
      tenant: tenant ? { id: tenant.id, name: tenant.name, slug: tenant.slug } : null,
      role,
    });

    setAuthCookies(response, { accessToken, refreshToken });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
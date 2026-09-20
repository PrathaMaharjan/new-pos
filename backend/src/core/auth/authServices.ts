import bcrypt from "bcrypt";
import { db } from "@/db";
import {
  AccessTokenPayload,
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from "./token.service";
import { locations, refreshTokens, tenantMembers, tenants, users } from "@/db/schema";
import { LoginInput } from "@/lib/validation/src/auth";
import { and, eq, isNull } from "drizzle-orm";

export class AuthError extends Error {}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function issueTokenPair(payload: AccessTokenPayload) {
  const accessToken = signAccessToken(payload);
  const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken();

  await db.insert(refreshTokens).values({
    userId: payload.userId,
    tokenHash,
    tenantId: payload.tenantId,
    locationId: payload.locationId,
    expiresAt,
  });

  return { accessToken, refreshToken };
}

export async function login(input: LoginInput) {
  try {
    const email = normalizeEmail(input.email);

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    const invalidCredentials = () => new AuthError("Invalid email or password");

    if (!user) throw invalidCredentials();

    if (!user.isActive) {
      throw new AuthError("This account has been deactivated");
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);

    if (!valid) throw invalidCredentials();

    const membership = await db.query.tenantMembers.findFirst({
      where: eq(tenantMembers.userId, user.id),
    });

    if (!membership) {
      throw new AuthError("No business found for this account");
    }

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, membership.tenantId),
    });

    const tenantLocations = await db.query.locations.findMany({
      where: eq(locations.tenantId, membership.tenantId),
    });

    const autoLocationId =
      tenantLocations.length === 1 ? tenantLocations[0].id : null;

    const { accessToken, refreshToken } = await issueTokenPair({
      userId: user.id,
      tenantId: membership.tenantId,
      role: membership.role,
      locationId: autoLocationId,
    });

    return {
      user,
      accessToken,
      refreshToken,
      locations: tenantLocations,
      needsLocationSelection: tenantLocations.length > 1,
      tenant,
      role: membership.role.toLowerCase(),
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    console.error("Login error:", error);

    throw new AuthError("Something went wrong during login");
  }
}

export async function refresh(rawRefreshToken: string) {
  try {
    const tokenHash = hashToken(rawRefreshToken);

    const existing = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
      ),
    });

    if (!existing) {
      throw new AuthError("Invalid refresh token");
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new AuthError("Refresh token has expired");
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, existing.userId),
    });

    if (!user || !user.isActive) {
      throw new AuthError("Account not found or inactive");
    }

    const membership = await db.query.tenantMembers.findFirst({
      where: eq(tenantMembers.userId, user.id),
    });

    if (!membership) {
      throw new AuthError("No business found for this account");
    }

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, existing.id));

    const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(
      {
        userId: user.id,
        tenantId: membership.tenantId,
        role: membership.role,
        locationId: existing.locationId,
      },
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    console.error("Refresh token error:", error);

    throw new AuthError("Unable to refresh authentication");
  }
}

export async function logout(rawRefreshToken: string) {
  try {
    const tokenHash = hashToken(rawRefreshToken);
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  } catch (error) {
    console.error("Logout error:", error);
    throw new AuthError("Unable to log out");
  }
}

export async function logoutAllSessions(userId: string) {
  try {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
      );
  } catch (error) {
    console.error("Logout all sessions error:", error);
    throw new AuthError("Unable to log out of all sessions");
  }
}

export async function selectLocation(
  currentSession: { userId: string; tenantId: string; role: string },
  locationId: string,
) {
  try {
    const location = await db.query.locations.findFirst({
      where: eq(locations.id, locationId),
    });
    if (!location || location.tenantId !== currentSession.tenantId) {
      throw new AuthError("Location not found for this business");
    }
    if (!location.isActive) {
      throw new AuthError("This location is inactive");
    }
    const { accessToken, refreshToken } = await issueTokenPair({
      userId: currentSession.userId,
      tenantId: currentSession.tenantId,
      role: currentSession.role,
      locationId: location.id,
    });
    return { accessToken, refreshToken, location };
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    console.error("Select location error:", error);
    throw new AuthError("Unable to select location");
  }
}

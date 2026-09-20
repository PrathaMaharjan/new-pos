import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema/location";
import { requireSession } from "@/middleware/auth.middleware";
import { handleApiError } from "@/lib/api-error";

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    const { id } = await params;

    const allowedRoles = ["owner", "admin", "manager"];
    if (!allowedRoles.includes(session.role.toLowerCase())) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to update outlets" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateLocationSchema.parse(body);

    const [updated] = await db
      .update(locations)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(eq(locations.id, id), eq(locations.tenantId, session.tenantId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Outlet updated successfully",
      location: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    const { id } = await params;

    const allowedRoles = ["owner", "admin"];
    if (!allowedRoles.includes(session.role.toLowerCase())) {
      return NextResponse.json(
        { error: "Forbidden: Only owners/admins can delete outlets" },
        { status: 403 }
      );
    }

    const [deleted] = await db
      .delete(locations)
      .where(and(eq(locations.id, id), eq(locations.tenantId, session.tenantId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Outlet deleted successfully",
      location: deleted,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/auth/locations/[id]
 * Get single outlet details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = requireSession(request);
    const { id } = await params;

    const location = await db.query.locations.findFirst({
      where: and(eq(locations.id, id), eq(locations.tenantId, session.tenantId)),
    });

    if (!location) {
      return NextResponse.json({ error: "Outlet not found" }, { status: 404 });
    }

    return NextResponse.json({ location });
  } catch (error) {
    return handleApiError(error);
  }
}

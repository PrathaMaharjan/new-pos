import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema/location";
import { requireSession } from "@/middleware/auth.middleware";
import { handleApiError } from "@/lib/api-error";


const createLocationSchema = z.object({
    name: z.string().min(1, "Outlet name is required").max(100),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.string().optional(),
});


export async function GET(request: NextRequest) {
    try {
        const session = requireSession(request);

        const tenantLocations = await db
            .select()
            .from(locations)
            .where(eq(locations.tenantId, session.tenantId))
            .orderBy(desc(locations.createdAt));

        return NextResponse.json({
            locations: tenantLocations,
        });
    } catch (error) {
        return handleApiError(error);
    }
}


export async function POST(request: NextRequest) {
    try {
        const session = requireSession(request);

        const allowedRoles = ["owner", "admin", "manager"];
        if (!allowedRoles.includes(session.role.toLowerCase())) {
            return NextResponse.json(
                { error: "Forbidden: You do not have permission to add outlets" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const validatedData = createLocationSchema.parse(body);

        const [newLocation] = await db
            .insert(locations)
            .values({
                tenantId: session.tenantId,
                name: validatedData.name,
                address: validatedData.address || null,
                city: validatedData.city || null,
                state: validatedData.state || null,
                country: validatedData.country || null,
                postalCode: validatedData.postalCode || null,
                phone: validatedData.phone || null,
                isActive: true,
            })
            .returning();

        return NextResponse.json(
            {
                message: "Outlet created successfully",
                location: newLocation,
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error);
    }
}


import bcrypt from "bcrypt";
import { eq, and } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema/users";
import { tenants, tenantMembers } from "../src/db/schema/tenants";
import { locations } from "@/db/schema";


const TEST_PASSWORD = "Password123";

async function main() {
  console.log("Seeding organization, location, and users...\n");

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  // ---- Organization (tenant) ----
  const tenantSlug = "test-org";
  let [tenant] = await db.select().from(tenants).where(eq(tenants.slug, tenantSlug));
  if (!tenant) {
    [tenant] = await db
      .insert(tenants)
      .values({ name: "Test Organization", slug: tenantSlug })
      .returning();
    console.log(`Created tenant: ${tenant.name}`);
  } else {
    console.log(`Tenant ${tenant.name} already exists`);
  }

  // ---- Location ----
  const existingLocations = await db
    .select()
    .from(locations)
    .where(eq(locations.tenantId, tenant.id));

  let mainLocation = existingLocations[0];
  if (!mainLocation) {
    [mainLocation] = await db
      .insert(locations)
      .values({
        tenantId: tenant.id,
        name: "Main Branch",
      })
      .returning();
    console.log(`Created location: ${mainLocation.name}`);
  } else {
    console.log(`Location ${mainLocation.name} already exists`);
  }

  // ---- Users + memberships ----
  const testUsers = [
    { email: "owner@test.com", firstName: "Test", lastName: "Owner", role: "OWNER" as const },
    { email: "staff@test.com", firstName: "Test", lastName: "Staff", role: "STAFF" as const },
  ];

  for (const u of testUsers) {
    let [user] = await db.select().from(users).where(eq(users.email, u.email));
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          email: u.email,
          passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
        })
        .returning();
      console.log(`✓ Created user: ${user.email}`);
    } else {
      console.log(`- User ${user.email} already exists`);
    }

    const [existingMembership] = await db
      .select()
      .from(tenantMembers)
      .where(and(eq(tenantMembers.userId, user.id), eq(tenantMembers.tenantId, tenant.id)));

    if (!existingMembership) {
      await db.insert(tenantMembers).values({
        userId: user.id,
        tenantId: tenant.id,
        role: u.role,
      });
      console.log(`  linked to ${tenant.name} as ${u.role}`);
    }
  }

  console.log(`\nAll test users share the password: ${TEST_PASSWORD}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

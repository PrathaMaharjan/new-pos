import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";


import { tenants } from "./tenants";
import { customers } from "./customers";

export const resourceTypes = pgTable(
  "resource_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),

    name: text("name").notNull(),

    description: text("description"),

    config: jsonb("config"),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index("resource_types_tenant_idx").on(
      table.tenantId,
    ),
  }),
);

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),

    resourceTypeId: uuid("resource_type_id")
      .notNull()
      .references(() => resourceTypes.id, {
        onDelete: "restrict",
      }),

    name: text("name").notNull(),

    description: text("description"),

    capacity: integer("capacity"),

    config: jsonb("config"),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index("resources_tenant_idx").on(
      table.tenantId,
    ),

    resourceTypeIdx: index(
      "resources_resource_type_idx",
    ).on(table.resourceTypeId),
  }),
);

export const bookingStatusEnum = pgEnum("booking_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
]);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),

    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, {
        onDelete: "restrict",
      }),

    customerId: uuid("customer_id").references(
      () => customers.id,
      {
        onDelete: "set null",
      },
    ),

    startTime: timestamp("start_time", {
      withTimezone: true,
    }).notNull(),

    endTime: timestamp("end_time", {
      withTimezone: true,
    }).notNull(),

    status: bookingStatusEnum("status")
      .notNull()
      .default("PENDING"),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index("bookings_tenant_idx").on(
      table.tenantId,
    ),

    resourceIdx: index("bookings_resource_idx").on(
      table.resourceId,
    ),

    startTimeIdx: index(
      "bookings_start_time_idx",
    ).on(table.startTime),
  }),
);

import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants";

export const modules = pgTable("modules", {
  id: uuid("id").defaultRandom().primaryKey(),

  key: text("key").notNull().unique(),

  name: text("name").notNull(),

  description: text("description"),

  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tenantModules = pgTable(
  "tenant_modules",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),

    moduleId: uuid("module_id")
      .notNull()
      .references(() => modules.id, {
        onDelete: "cascade",
      }),

    enabled: boolean("enabled").notNull().default(true),

    config: jsonb("config"),

    enabledAt: timestamp("enabled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantModuleUnique: unique().on(table.tenantId, table.moduleId),
  }),
);

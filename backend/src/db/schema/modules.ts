import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants";

export const modules = pgTable("modules", {
  // CHANGED: `key` is now the primary key itself, instead of a separate
  // uuid id sitting next to a unique `key` column. This table is read on
  // almost every request in the system ("is module X enabled for this
  // tenant?"), so removing the extra id->key hop keeps that check to a
  // single lookup instead of two.
  key: text("key").primaryKey(),
 
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
 
    // CHANGED: references modules.key directly (text) instead of
    // modules.id (uuid) — this is what removes the extra join when
    // checking whether a module is enabled.
    moduleKey: text("module_key")
      .notNull()
      .references(() => modules.key, {
        onDelete: "cascade",
      }),
 
    enabled: boolean("enabled").notNull().default(true),
 
    config: jsonb("config"),
 
    enabledAt: timestamp("enabled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantModuleUnique: unique().on(table.tenantId, table.moduleKey),
    // check this index makes that the single fastest lookup possible.
    tenantModuleIdx: index("tenant_modules_tenant_module_idx").on(
      table.tenantId,
      table.moduleKey,
    ),
  }),
);
 

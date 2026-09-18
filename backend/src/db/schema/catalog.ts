import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  decimal,
  index,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),

    name: text("name").notNull(),

    description: text("description"),

    sku: text("sku"),

    price: decimal("price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index("products_tenant_idx").on(table.tenantId),
  }),
);

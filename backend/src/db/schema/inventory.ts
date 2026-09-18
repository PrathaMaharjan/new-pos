import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  index,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { products } from "./catalog";

export const inventoryMovementTypeEnum = pgEnum(
  "inventory_movement_type",
  [
    "PURCHASE",
    "SALE",
    "ADJUSTMENT",
    "RETURN",
    "DAMAGE",
  ],
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),

    productId: uuid("product_id")
      .notNull()
      .unique()
      .references(() => products.id, {
        onDelete: "cascade",
      }),

    quantity: decimal("quantity", {
      precision: 12,
      scale: 3,
    })
      .notNull()
      .default("0"),

    reorderLevel: decimal("reorder_level", {
      precision: 12,
      scale: 3,
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantIdx: index("inventory_items_tenant_idx").on(table.tenantId),
  }),
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    inventoryItemId: uuid("inventory_item_id")
      .notNull()
      .references(() => inventoryItems.id, {
        onDelete: "cascade",
      }),

    type: inventoryMovementTypeEnum("type").notNull(),

    quantity: decimal("quantity", {
      precision: 12,
      scale: 3,
    }).notNull(),

    reason: text("reason"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    inventoryItemIdx: index(
      "inventory_movements_inventory_item_idx",
    ).on(table.inventoryItemId),
  }),
);

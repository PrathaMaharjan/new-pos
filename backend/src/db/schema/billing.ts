import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  decimal,
  index,
  unique,
} from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { customers } from "./customers";
import { products } from "./catalog";
import { bookings } from "./bookings";
import { locations } from "./location";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "VOID",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "DIGITAL_WALLET",
  "OTHER",
]);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, {
        onDelete: "cascade",
      }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, {
        onDelete: "restrict",
      }),

    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),

    invoiceNumber: text("invoice_number").notNull(),

    status: invoiceStatusEnum("status").notNull().default("DRAFT"),

    subtotal: decimal("subtotal", {
      precision: 12,
      scale: 2,
    }).notNull(),

    tax: decimal("tax", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    discount: decimal("discount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    total: decimal("total", {
      precision: 12,
      scale: 2,
    }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantInvoiceNumberUnique: unique().on(
      table.tenantId,
      table.invoiceNumber,
    ),

    tenantIdx: index("invoices_tenant_idx").on(table.tenantId),

    // Powers "today's invoices/revenue for Location X" — the single most
    // common report a shop with multiple branches will run.
    locationIdx: index("invoices_location_idx").on(table.locationId),
  }),
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, {
        onDelete: "cascade",
      }),

    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),

    bookingId: uuid("booking_id").references(() => bookings.id, {
      onDelete: "set null",
    }),

    description: text("description").notNull(),

    quantity: decimal("quantity", {
      precision: 12,
      scale: 3,
    }).notNull(),

    unitPrice: decimal("unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    amount: decimal("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    taxCategory: text("tax_category"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    invoiceIdx: index("invoice_items_invoice_idx").on(
      table.invoiceId,
    ),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, {
        onDelete: "cascade",
      }),

    amount: decimal("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    method: paymentMethodEnum("method").notNull(),

    reference: text("reference"),

    paidAt: timestamp("paid_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    invoiceIdx: index("payments_invoice_idx").on(
      table.invoiceId,
    ),
  }),
);
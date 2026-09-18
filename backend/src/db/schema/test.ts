import { pgTable, text } from "drizzle-orm/pg-core";

export const testTable = pgTable("test", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

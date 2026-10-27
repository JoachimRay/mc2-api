import {
  numeric,
  pgTable,
  timestamp,
  text,
  uuid,
} from "drizzle-orm/pg-core";

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  balance: numeric("balance").notNull().default("0"),
  lastPaid: text("last_paid").notNull().default("never"),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role").notNull().default("client"),
}).enableRLS();

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2, mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

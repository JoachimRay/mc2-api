import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, entries } from "@/db/schema";

export class CustomerNotFoundError extends Error {
  constructor() {
    super("Customer not found");
    this.name = "CustomerNotFoundError";
  }
}

export class PaymentExceedsBalanceError extends Error {
  constructor() {
    super("Payment cannot be more than the current balance");
    this.name = "PaymentExceedsBalanceError";
  }
}

export async function readEntries(customerId: string) {
  return db
    .select()
    .from(entries)
    .where(eq(entries.customerId, customerId))
    .orderBy(desc(entries.createdAt));
}

export async function recordEntry(
  customerId: string,
  kind: "due" | "payment",
  amount: number,
) {
  return db.transaction(async (tx) => {
    const [customer] = await tx
      .select({ id: customers.id, balance: customers.balance })
      .from(customers)
      .where(eq(customers.id, customerId))
      .for("update");

    if (!customer) throw new CustomerNotFoundError();

    const currentBalance = Number(customer.balance);
    if (kind === "payment" && amount > currentBalance) {
      throw new PaymentExceedsBalanceError();
    }

    const [entry] = await tx
      .insert(entries)
      .values({ customerId, kind, amount })
      .returning();

    const change = kind === "due" ? amount : -amount;
    const lastPaid =
      kind === "payment"
        ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : undefined;

    await tx
      .update(customers)
      .set({
        balance: sql`${customers.balance} + ${change}`,
        ...(lastPaid ? { lastPaid } : {}),
      })
      .where(eq(customers.id, customerId));

    return entry;
  });
}

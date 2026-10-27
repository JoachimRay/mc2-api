import * as z from "zod";

export const CustomerSchema = z.object({
  name: z.string().trim().min(2, { error: "The name needs at least 2 characters." }),
  balance: z.coerce.number({ error: "Enter the amount owed as a number." }).min(0, { error: "The amount owed cannot be negative." }),
  lastPaid: z.string().trim().default("never"),
});

export const CredentialsSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  password: z.string().min(6, { error: "The password needs at least 6 characters." }),
});

export const EntrySchema = z.object({
  kind: z.enum(["due", "payment"], { error: "Choose a due or a payment." }),
  amount: z.coerce
    .number({ error: "Enter the amount as a number." })
    .positive({ error: "The amount must be more than zero." })
    .max(99_999_999.99, { error: "The amount is too large." })
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
      error: "Use no more than two decimal places.",
    }),
});

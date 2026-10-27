CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" text NOT NULL,
	"kind" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entries_kind_check" CHECK ("kind" IN ('due', 'payment')),
	CONSTRAINT "entries_amount_positive_check" CHECK ("amount" > 0),
	CONSTRAINT "entries_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "entries_customer_created_at_idx" ON "entries" USING btree ("customer_id", "created_at" DESC);
--> statement-breakpoint
ALTER TABLE "entries" ENABLE ROW LEVEL SECURITY;

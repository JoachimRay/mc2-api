import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { db } from "@/db";
import { customers, entries } from "@/db/schema";
import { asc } from "drizzle-orm";
import { CustomerSchema } from "@/lib/definitions";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET(request: Request) {
	const profile = await getProfile(request);

	if (!profile) {
		return NextResponse.json(
			{ error: "Authentication required" },
			{ status: 401, headers: corsHeaders },
		);
	}

	const rows = await db.select().from(customers).orderBy(asc(customers.name));
	return NextResponse.json(
		rows.map((row) => ({ ...row, balance: Number(row.balance), lastPaid: row.lastPaid })),
		{ headers: corsHeaders },
	);
}

export async function POST(request: Request) {
	const profile = await getProfile(request);

	if (!profile) {
		return NextResponse.json(
			{ error: "Authentication required" },
			{ status: 401, headers: corsHeaders },
		);
	}

	if (profile.role !== "admin") {
		return NextResponse.json(
			{ error: "Admin access required" },
			{ status: 403, headers: corsHeaders },
		);
	}

	try {
		const body: unknown = await request.json();
		const parsed = CustomerSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid customer data", issues: parsed.error.flatten().fieldErrors },
				{ status: 400, headers: corsHeaders },
			);
		}

		const customer = {
			id: `c${Date.now()}`,
			name: parsed.data.name,
			balance: String(parsed.data.balance),
			lastPaid: parsed.data.lastPaid,
		};

		await db.transaction(async (tx) => {
			await tx.insert(customers).values(customer);
			if (parsed.data.balance > 0) {
				await tx.insert(entries).values({
					customerId: customer.id,
					kind: "due",
					amount: parsed.data.balance,
				});
			}
		});

		return NextResponse.json(
			{ ...customer, balance: parsed.data.balance },
			{ status: 201, headers: corsHeaders },
		);
	} catch {
		return NextResponse.json(
			{ error: "Request body must be valid JSON" },
			{ status: 400, headers: corsHeaders },
		);
	}
}

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

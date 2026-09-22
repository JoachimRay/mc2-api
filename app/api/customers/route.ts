import { NextResponse } from "next/server";
import { ROWS } from "../rows";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

export function GET() {
	return NextResponse.json(ROWS, { headers: corsHeaders });
}

export async function POST(request: Request) {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Request body must be valid JSON" },
			{ status: 400, headers: corsHeaders },
		);
	}

	if (!body || typeof body !== "object") {
		return NextResponse.json(
			{ error: "Request body must be a JSON object" },
			{ status: 400, headers: corsHeaders },
		);
	}

	const input = body as Record<string, unknown>;
	const name = typeof input.name === "string" ? input.name.trim() : "";
	const balance = input.balance === undefined ? 0 : Number(input.balance);
	const lastPaid = input.lastPaid === undefined ? "" : String(input.lastPaid);

	if (!name || !Number.isFinite(balance)) {
		return NextResponse.json(
			{ error: "name is required and balance must be a number" },
			{ status: 400, headers: corsHeaders },
		);
	}

	const customer = {
		id: `c${ROWS.length + 1}`,
		name,
		balance,
		lastPaid,
	};

	ROWS.push(customer);

	return NextResponse.json(customer, { status: 201, headers: corsHeaders });
}

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

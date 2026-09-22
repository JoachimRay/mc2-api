import { NextResponse } from "next/server";
import { ROWS } from "../../rows";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const row = ROWS.find((item) => item.id === id);

	if (!row) {
		return NextResponse.json(
			{ error: "Customer not found" },
			{ status: 404, headers: corsHeaders },
		);
	}

	return NextResponse.json(row, { headers: corsHeaders });
}

export function OPTIONS() {
	return new NextResponse(null, { status: 204, headers: corsHeaders });
}

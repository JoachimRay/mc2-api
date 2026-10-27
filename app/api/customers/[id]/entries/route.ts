import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { EntrySchema } from "@/lib/definitions";
import { getProfile } from "@/lib/auth";
import {
  CustomerNotFoundError,
  PaymentExceedsBalanceError,
  readEntries,
  recordEntry,
} from "@/lib/customer-entries";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  const profile = await getProfile(request);
  if (!profile) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401, headers: corsHeaders },
    );
  }

  const { id } = await params;
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, id));

  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404, headers: corsHeaders },
    );
  }

  const history = await readEntries(id);
  return NextResponse.json(history, { headers: corsHeaders });
}

export async function POST(request: Request, { params }: Context) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400, headers: corsHeaders },
    );
  }

  const parsed = EntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid ledger entry", issues: parsed.error.flatten().fieldErrors },
      { status: 400, headers: corsHeaders },
    );
  }

  const { id } = await params;
  try {
    const entry = await recordEntry(id, parsed.data.kind, parsed.data.amount);
    return NextResponse.json(entry, { status: 201, headers: corsHeaders });
  } catch (error) {
    if (error instanceof CustomerNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404, headers: corsHeaders },
      );
    }
    if (error instanceof PaymentExceedsBalanceError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: corsHeaders },
      );
    }
    throw error;
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

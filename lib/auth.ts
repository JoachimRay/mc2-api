import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { validateAuthorizationHeader } from "@/lib/proxy";
const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
{
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
},
);
export async function getProfile(request: Request) {
const token = validateAuthorizationHeader(request.headers.get("Authorization"));
if (!token) return null;

const { data, error } = await supabase.auth.getClaims(token);
if (error || !data?.claims?.sub) return null;

const { sub: id, email = "" } = data.claims;
const [existingProfile] = await db.select().from(profiles).where(eq(profiles.id, id));
if (existingProfile) return existingProfile;

// New signups are clients. Do not rely on the database default for roles.
await db.insert(profiles).values({ id, email, role: "client" }).onConflictDoNothing();
const [profile] = await db.select().from(profiles).where(eq(profiles.id, id));
return profile ?? null;
}

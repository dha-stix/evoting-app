import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Admin } from "@/types";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Client acting as the signed-in admin (or anonymous visitor). Every query
 * goes through row-level security.
 */
export function createSessionClient() {
	const cookieStore = cookies();
	return createServerClient(url(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
		cookies: {
			getAll: () => cookieStore.getAll(),
			setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
				try {
					list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
				} catch {
					// Called from a server component: the middleware refreshes the session instead.
				}
			},
		},
	});
}

// Untyped until the schema types are generated with `supabase gen types`.
let service: SupabaseClient<any, "public", any> | null = null;

/**
 * Service-role client that bypasses row-level security. Only for voter
 * registration, verification and casting votes, after the server has done its
 * own checks. Never import this into client code.
 */
export function createServiceClient() {
	if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
	service ??= createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false },
	});
	return service;
}

/** The signed-in admin's profile, or null. Cached for one request. */
export const getCurrentAdmin = cache(async (): Promise<Admin | null> => {
	const supabase = createSessionClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) return null;
	const { data } = await supabase.from("admins").select("*").eq("id", user.id).maybeSingle();
	return (data as Admin | null) ?? null;
});

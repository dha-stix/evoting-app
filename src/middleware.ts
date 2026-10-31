import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Keeps the admin's Supabase session fresh and sends signed-out visitors on
 * /admin to the sign-in page. Role checks happen again on the server in the
 * admin layout and in every server action.
 */
export async function middleware(request: NextRequest) {
	let response = NextResponse.next({ request });

	const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
		cookies: {
			getAll: () => request.cookies.getAll(),
			setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
				list.forEach(({ name, value }) => request.cookies.set(name, value));
				response = NextResponse.next({ request });
				list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
			},
		},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const isLogin = request.nextUrl.pathname.startsWith("/admin/login");
	if (!user && !isLogin) {
		const url = request.nextUrl.clone();
		url.pathname = "/admin/login";
		url.search = "";
		return NextResponse.redirect(url);
	}

	if (user && !isLogin) {
		// Accounts with two-step sign-in must finish it before seeing admin pages.
		const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
		if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
			const url = request.nextUrl.clone();
			url.pathname = "/admin/login";
			url.search = "?step=mfa";
			return NextResponse.redirect(url);
		}
	}

	return response;
}

export const config = {
	matcher: ["/admin/:path*"],
};

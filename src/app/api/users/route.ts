import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";

export async function POST(req: NextRequest) {
	const { email, password } = await req.json();

	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	if (error) {
		return NextResponse.json(
			{ message: error.message, success: false },
			{ status: 400 }
		);
	}
	

	return NextResponse.json(
		{ message: "Sign in successful!", success: true, data },
		{ status: 200 }
	);
}
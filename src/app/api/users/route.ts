import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";
import Cryptr from "cryptr";
const cryptr = new Cryptr(process.env.NEXT_PUBLIC_SECRET!);

export async function POST(req: NextRequest) {
	const { email, password } = await req.json();

	const decryptedEmail = cryptr.decrypt(email);
	const decryptedPassword = cryptr.decrypt(password);

	const { data, error } = await supabase.auth.signInWithPassword({
		email: decryptedEmail,
		password: decryptedPassword,
	});

	if (error) {
		return NextResponse.json(
			{ message: error.message, success: false },
			{ status: 400 }
		);
	}

	const stringifyData = JSON.stringify(data);
	const newData = cryptr.encrypt(stringifyData);

	return NextResponse.json(
		{ message: "Sign in successful!", success: true, data: newData },
		{ status: 200 }
	);
}
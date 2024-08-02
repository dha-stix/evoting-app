import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";

export async function GET() {
	const { data, error } = await supabase
		.from("voters")
		.select("first_name, last_name,other_name, _vin, gender")
		.order("last_name", { ascending: true }).limit(20)

	if (error) {
		return NextResponse.json(
			{ message: "Error fetching voters", success: false },
			{ status: 500 }
		);
	}
	return NextResponse.json({ voters: data, success: true }, { status: 200 });
}


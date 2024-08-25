import { NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";

export async function GET() {
	const { data, error, count } = await supabase
		.from("voters")
		.select("first_name, last_name,other_name, _vin, gender", {count: "exact"})
		.order("last_name", { ascending: true }).limit(50);

	if (error) {
		return NextResponse.json(
			{ message: "Error fetching voters", success: false },
			{ status: 500 }
		);
	}
	return NextResponse.json({ voters: data, count,  success: true }, { status: 200 });
}


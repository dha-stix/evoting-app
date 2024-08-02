import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";

export async function POST(req: NextRequest) {
	const { vin } = await req.json();

	const { data, error } = await supabase
		.from("voters")
		.select(
			"first_name, last_name, other_name, date_of_birth, _vin, home_addr, home_lga, occupation, gender"
		)
		.eq("_vin,", vin)
		.single();

	if (error) {
		return NextResponse.json(
			{ message: "An error occurred", success: false },
			{ status: 500 }
		);
	}

	return NextResponse.json(
		{
			message: "Data fetched successfully",
			success: true,
			data: {
				image: `https://irsllqulhmnktjsevtmy.supabase.co/storage/v1/object/public/picture/${vin}/image`,
				...data,
			},
		},
		{ status: 200 }
	);
}
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";

export async function GET(req: NextRequest) {
	const vin = req.nextUrl.searchParams.get("vin");
	const { data, error } = await supabase
		.from("voters")
		.select("first_name, last_name,other_name, _vin, gender")
		.eq("_vin", vin);

	if (data && data?.length === 0) {
		const { data, error: searchError } = await supabase
			.from("voters")
			.select("first_name, last_name,other_name, _vin, gender")
			.order("last_name", { ascending: true })
			.limit(20);
		if(searchError){
			return NextResponse.json(
				{ message: "Error fetching voters", success: false },
				{ status: 500 }
			);
		}
		return NextResponse.json({ voter: data, success: true }, { status: 200 });
	}

	if (error) {
		return NextResponse.json(
			{ message: "Error fetching voters", success: false },
			{ status: 500 }
		);
	}
	return NextResponse.json({ voter: data, success: true }, { status: 200 });
}
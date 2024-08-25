import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";

export async function POST(req: NextRequest) {
	const {
		name,
		type,
		status,
		active,
		description,
		candidates,
		start_date,
		end_date,
	} = await req.json();

	//if an election type is active, don't allow another election of the same type to be created
	const { data: activeElections, error: activeElectionsError } = await supabase
		.from("elections")
		.select("*")
		.eq("active", true)
		.eq("type", type);
	
	if (activeElectionsError) { 
		return NextResponse.json(
			{ message: "Failed to fetch active elections", success: false, error: activeElectionsError },
			{ status: 500 }
		);
	}
	if (activeElections.length > 0) {
		return NextResponse.json(
			{ message: "This election is currently in progress!", success: false },
			{ status: 400 }
		);
	}

	const { data, error } = await supabase
		.from("elections")
		.insert({
			name,
			type,
			status,
			active,
			description,
			candidates: JSON.stringify(candidates),
			start_date,
			end_date,
			results: JSON.stringify([]),
		});

    if (error) {
        console.log(error);
		return NextResponse.json(
			{ message: "Failed to create election", success: false, error },
			{ status: 500 }
		);
	}

	return NextResponse.json(
		{ message: "Election created successfully", success: true},
		{ status: 201 }
	);
}

export async function GET() { 
	const { data, error, count } = await supabase.from("elections").select("*", { count: "exact" }).order("active", { ascending: false });
    if (error) {
        return NextResponse.json(
            { message: "Failed to fetch elections", success: false, error },
            { status: 500 }
        );
    }
    return NextResponse.json({ message: "Elections fetched successfully", success: true, count, data }, { status: 200 });
}


export async function PATCH(req: NextRequest) {
	const { id, status } = await req.json();
	const { data, error } = await supabase
		.from("elections")
		.update({ status, active: false })
		.eq("id", id);

	if (error) {
		return NextResponse.json(
			{ message: "Failed to update election", success: false, error },
			{ status: 500 }
		);
	}
	return NextResponse.json({ message: "Election Ended 🚨", success: true }, { status: 200 });
}
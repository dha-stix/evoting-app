import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";

export async function POST(req: NextRequest) {
	const { candidateName, electionType, party, district } = await req.json();

	if (electionType !== "sen" && electionType !== "gov") {
		return NextResponse.json(
			{ message: "Invalid election type", success: false },
			{ status: 400 }
		);
	}

	try {
		if (electionType === "sen") {
			const { data, error } = await supabase
				.from("candidates")
				.select("*")
				.eq("sen_type", district)
				.eq("party", party)
				.eq("election_type", electionType);
			if (data && data.length > 0) {
				return NextResponse.json(
					{
						message: "Candidate already exists for this position",
						error,
						success: false,
					},
					{ status: 500 }
				);
			}
			const { data: candidateData, error: candidateError } = await supabase
				.from("candidates")
				.insert({
					name: candidateName,
					election_type: electionType,
					party,
					sen_type: district,
				});

			if (!candidateError) {
				return NextResponse.json(
					{
						message: "Senatorial candidate added",
						candidateData,
						success: true,
					},
					{ status: 201 }
				);
			}
		} else {
			const { data, error } = await supabase
				.from("candidates")
				.select("*")
				.eq("party", party)
				.eq("election_type", electionType);
			if (data && data.length > 0) {
				return NextResponse.json(
					{
						message: "Candidate already exists for this position",
						error,
						success: false,
					},
					{ status: 500 }
				);
			}
			const { data: candidateData, error: candidateError } = await supabase
				.from("candidates")
				.insert({
					name: candidateName,
					election_type: electionType,
					party,
				});

			if (!candidateError) {
				return NextResponse.json(
					{
						message: "Governorship candidate added",
						candidateData,
						success: true,
					},
					{ status: 201 }
				);
			}
		}
	} catch (error) {
		return NextResponse.json(
			{ message: "An error occured, please try again", success: false },
			{ status: 500 }
		);
	}
}

export async function GET() {
	const { data, error } = await supabase
		.from("candidates")
		.select("*")
		.eq("election_type", "sen")
		.order("party", { ascending: true });
	const { data: govData, error: govError } = await supabase
		.from("candidates")
		.select("*")
		.eq("election_type", "gov")
		.order("party", { ascending: true });

	if (error || govError) {
		return NextResponse.json(
			{ message: "An error occured", success: false },
			{ status: 500 }
		);
	}
	return NextResponse.json(
		{ senators: data, governors: govData, success: true },
		{ status: 200 }
	);
}
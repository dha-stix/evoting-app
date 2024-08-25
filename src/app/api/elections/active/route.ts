import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";


const convertElection = (election: Election) => {
	return {
		...election,
		candidates:
			typeof election.candidates === "string"
				? (JSON.parse(election.candidates) as FormCandidates[])
				: election.candidates,
		results:
			typeof election.results === "string"
				? (JSON.parse(election.results) as FormCandidates[])
				: election.results,
	};
};

export async function GET() {
	const { data, error, count } = await supabase
		.from("elections")
		.select("*", { count: "exact" })
		.eq("active", true)
		.eq("type", "sen")
		.eq("status", "In Progress")

	const {
		data: govData,
		error: govError,
		count: govCount,
	} = await supabase
		.from("elections")
		.select("*", { count: "exact" })
		.eq("active", true)
		.eq("type", "gov")
		.eq("status", "In Progress")

    if (govError || error) {
        return NextResponse.json(
            { message: "Failed to fetch elections", success: false, error: govError },
            { status: 500 }
        );
    } else if (count === 0 && govCount === 0) {
        return NextResponse.json(
            { message: "No active elections found", success: false },
            { status: 404 }
        );
    } else if (count === 0) {
        return NextResponse.json(
            {
                message: "Elections fetched successfully",
                success: true,
                gov: convertElection(govData[0]),
                sen: null,
            },
            { status: 200 }
        );
    } else if (govCount === 0) { 
        return NextResponse.json(
            {
                message: "Elections fetched successfully",
                success: true,
                gov: null,
                sen: convertElection(data[0]),
            },
            { status: 200 }
        );
    }
    return NextResponse.json(
            {
                message: "Elections fetched successfully",
                success: true,
                gov: convertElection(govData[0]),
                sen: convertElection(data[0]),
            },
            { status: 200 }
        );
	
}

export async function POST(req: NextRequest) {
    const { name, party, voter_id, sen_type, election, type } = await req.json();

     const {data, error} = await supabase.from("elections").select("results, voters").eq("id", election).eq("type", type).eq("active", true).eq("status", "In Progress").single();

    if (error) {
        return NextResponse.json({ message: "An error occured", success: false }, { status: 500 });
    } else if (!data) { 
        return NextResponse.json({ message: "Election not found", success: false }, { status: 404 });
    }

    const voters = data.voters || [];
  
    if (voters.includes(voter_id)) {
        return NextResponse.json({ message: "You have already voted", success: false }, { status: 403 });
    }
    voters.push(voter_id);

    const results = data.results ? JSON.parse(data.results) as Result[] : [];
    const candidate = results.find(candidate => candidate.name === name);
    if (candidate) {
        candidate.vote_count += 1;
        candidate.voters.push(voter_id);

    } else {
        results.push({ name, party, vote_count: 1, voters, sen_type });
    }

    const { error: updateError } = await supabase.from("elections").update({ results: JSON.stringify(results), voters }).eq("id", election).eq("type", type).eq("active", true).eq("status", "In Progress");

    if (updateError) {
        return NextResponse.json({ message: "An error occured", success: false }, { status: 500 });
    }

    return NextResponse.json({ message: "Vote casted successfully", success: true }, { status: 201 });

}
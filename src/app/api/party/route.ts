import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";

export async function POST(req: NextRequest) { 
    const { partyName, logo, partyAcronym } = await req.json();

    try {
        const logoBlob: Blob = await fetch(logo).then((res) => res.blob());
        if (logoBlob) {
            const { error } = await supabase.storage.from("party").upload(`/${partyAcronym}/logo`, logoBlob)	
            if (error) throw error
        }

        const { error } = await supabase.from("parties").insert({
            name: partyName,
            acronym: partyAcronym,
            logo: `https://irsllqulhmnktjsevtmy.supabase.co/storage/v1/object/public/party/${partyAcronym}/logo`
        })
        if (error) throw error


        return NextResponse.json(
            { message: "Party Registration Successful!", success: true },
            { status: 201 }
        )

    }catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "An error occured, please try again", success: false },
            { status: 500 }
        )
    }
    
}

export async function GET() { 
    try {
        const { data, error, count } = await supabase.from("parties").select("*", {count: "exact"}).order("name", { ascending: true })

        if (error) throw error

        return NextResponse.json({
            message: "Parties fetched successfully",
            parties: data,
            count
        }, { status: 200 })

    } catch (error) {
        return NextResponse.json(
            { message: "An error occured, please try again", success: false },
            { status: 500 }
        )
    }
}
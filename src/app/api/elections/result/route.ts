import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";

export async function GET(req: NextRequest) {
    const { data, error } = await supabase.from("elections").select("name, description,  start_date, end_date, results, voters, active").order("created_at", { ascending: false });


     if (error) {
        return NextResponse.json({ message: "Failed to fetch elections", success: false, error }, { status: 500 });
     }

    


    return NextResponse.json({ message: "Vote casted successfully", success: true, data }, { status: 200 });

}
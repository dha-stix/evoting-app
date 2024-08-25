import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";

export async function POST(req: NextRequest) { 
    const { vin, nin, email, date_of_birth } = await req.json();

    const { data, error } = await supabase.from("voters").select("id, email, first_name, home_lga").eq("_vin", vin).eq("nin", Number(nin)).eq("email", email).eq("date_of_birth", date_of_birth)

    if (data?.length === 0 || !data) {
        return NextResponse.json(
            { message: "Invalid credentials", success: false },
            { status: 400 }
        );
    }

    if (error) 
        return NextResponse.json(
            { message: "An error occurred while verifying your details", success: false },
            { status: 500 }
        );
    
    return NextResponse.json(
        { message: "Details verified", success: true, user: data[0] },
        { status: 200 }
    ); 
}



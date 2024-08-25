import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/app/utils/supabase";

const generateCode = () => Math.floor(100000 + Math.random() * 900000);
const code = generateCode();

const resend = new Resend(process.env.RESEND_API_KEY);


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


// export async function GET(req: NextRequest) {
//     const email = req.nextUrl.searchParams.get("email");
//     const last_name = req.nextUrl.searchParams.get("lastName");
    
//     if (!email || !last_name) 
//        return NextResponse.json(
// 		{ message: "Invalid credentials", success: false},
// 		{ status: 400 })
    
//     const { data, error } = await resend.emails.send({
// 		to: email,
// 		subject: "Authorize Printing your Voter's Card",
// 		from: "E-voting App <onboarding@resend.dev>",
// 		text: `Your verification code is ${code}`,
//     });

//    if (error)
// 		return NextResponse.json(
// 			{ message: "An error occurred while sending the email!", success: false },
// 			{ status: 500 }
// 		);
    
// 	return NextResponse.json(
// 		{ message: "Code delivered to your email", success: true},
// 		{ status: 200 }
// 	);
// }


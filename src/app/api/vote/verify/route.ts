import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "../../../../../utils/supabase";
import { error } from "console";

const generateCode = () => Math.floor(100000 + Math.random() * 900000);
const code = generateCode();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
    const email = req.nextUrl.searchParams.get("email");
    const last_name = req.nextUrl.searchParams.get("lastName");
    
    if (!email || !last_name) 
       return NextResponse.json(
		{ message: "Invalid credentials", success: false},
		{ status: 400 })
    
    const { data, error } = await resend.emails.send({
		to: email,
		subject: "Authorize Printing your Voter's Card",
		from: "E-voting App <onboarding@resend.dev>",
		text: `Your verification code is ${code}`,
    });

   if (error)
		return NextResponse.json(
			{ message: "An error occurred while sending the email!", success: false },
			{ status: 500 }
		);
    
	return NextResponse.json(
		{ message: "Code delivered to your email", success: true},
		{ status: 200 }
	);
}

export async function POST(req: NextRequest) { 
    const { email, last_name, verificationCode } = await req.json();
    
    if (Number(verificationCode) !== code)
		return NextResponse.json(
			{ message: "Invalid verification code!", success: false },
			{ status: 400 }
        );

    try { 
        const {data, error} = await supabase.from("voters").select()
            .eq("email", email).eq("last_name", last_name)
        
        if (error) throw error

        if (data) {
            const { data: imageData, error } = await supabase.storage.from('picture').download(`${data[0]._vin}/image`)
            if (error) throw error
            const userData = { image: `https://irsllqulhmnktjsevtmy.supabase.co/storage/v1/object/public/picture/${data[0]._vin}/image`, other: data[0] }
            
            return NextResponse.json(
                { data: userData, success: true },
                { status: 200 }
            );  
        }
        
    } catch (err) {
        console.log(err)
        return NextResponse.json(
		{ message: "Encountered an error",  success: false},
		{ status: 400 }
	);
    }
}
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "../../../../utils/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);
const generateCode = () => Math.floor(100000 + Math.random() * 900000);
const code = generateCode();

const generateRandomLetter = (): string => {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	return alphabet[Math.floor(Math.random() * alphabet.length)];
};

const generateRandomNumber = (): string =>
	Math.floor(Math.random() * 10).toString();

const shuffleArray = (array: any[]): void => {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
};

const generateVIN = (): string => {
	const letters = Array.from({ length: 3 }, generateRandomLetter);
	const numbers = Array.from({ length: 6 }, generateRandomNumber);

	let result = [...letters, ...numbers, ...letters];
	shuffleArray(result);

	return result.join("");
};

const _vin = generateVIN();

export async function GET(req: NextRequest) {
	const userEmail = req.nextUrl.searchParams.get("email");

	if (!userEmail)
		return NextResponse.json(
			{ message: "Email is required!" },
			{ status: 400 }
		);

	const { data, error } = await resend.emails.send({
		to: userEmail,
		subject: "Email Verification",
		from: "E-voting App <onboarding@resend.dev>",
		text: `Your verification code is ${code}`,
	});

	if (error)
		return NextResponse.json(
			{ message: "An error occurred while sending the email!" },
			{ status: 500 }
		);

	return NextResponse.json(
		{ message: "Code delivered to your email", data },
		{ status: 200 }
	);
}

export async function POST(req: NextRequest) {
	const {
		verificationCode,
		names,
		email,
		dob,
		occupation,
		nin,
		addrLGA,
		addrState,
		addrZone,
		homeAddr,
		origins,
		imageData,
	} = await req.json();
	const { firstName, lastName, otherName } = names;
	const { state, lga } = origins;

	if (Number(verificationCode) !== code)
		return NextResponse.json(
			{ message: "Invalid verification code!", success: false },
			{ status: 400 }
		);

	try {
		const imageBlob: Blob = await fetch(imageData).then((res) => res.blob());

		const { error } = await supabase
			.from("voters")
			.insert({
				_vin,
				email,
				first_name: firstName,
				last_name: lastName,
				other_name: otherName,
				date_of_birth: dob,
				occupation,
				nin: Number(nin),
				home_addr: homeAddr,
				home_lga: addrLGA,
				home_state: addrState,
				home_geo_zone: addrZone,
				origin_lga: lga,
				origin_state: state,
			})
			.single();
		if (imageBlob) {
			const { error } = await supabase.storage.from("picture").upload(`/${_vin}/image}`, imageBlob)	
			if (error) throw error
		}
		if (error) throw error

		return NextResponse.json(
		{ message: "Registration completed!", success: true },
		{ status: 200 }
	);
	} catch (err) {
		return NextResponse.json(
		{ message: "Invalid Data! or Voter already exists", success: false},
		{ status: 400 }
	);
	}
}
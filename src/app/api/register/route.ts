import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

const generateVIN = (): string => {
	const numbers = '0123456789';
	const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    
    function getRandomUniqueChars(source: string, count: number): string {
        let result = '';
        const sourceArray = source.split('');
        while (result.length < count) {
            const randomIndex = Math.floor(Math.random() * sourceArray.length);
            const char = sourceArray.splice(randomIndex, 1)[0];
            result += char;
        }
        return result;
    }

    const randomNumbers = getRandomUniqueChars(numbers, 4);
    const randomAlphabets = getRandomUniqueChars(alphabets, 8);
    const combined = randomNumbers + randomAlphabets;

    // Shuffle the combined result
    const shuffledResult = combined.split('').sort(() => 0.5 - Math.random()).join('');

    return shuffledResult;
}

async function generateOpenAIEmbeddings(profile: any) {
    const textToEmbed = Object.values(profile).join(' ');
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: textToEmbed,
    });
    return response.data[0].embedding;
}

const _vin = generateVIN();

export async function POST(req: NextRequest) {
    const profile = await req.json();
    const {
		first_name,
        last_name,
        middle_name,
        date_of_birth,
        email_address,
        occupation,
        phone_number,
        nin,
        gender,
        lga_of_origin,
        state_of_origin,
        residential_address,
        state_of_residence,
        lga_of_residence,
        image_url,
    } =  profile;

    try {
        const imageBlob: Blob = await fetch(image_url).then((res) => res.blob());
		const embeddings = await generateOpenAIEmbeddings({ imageBlob });

        const { error } = await supabase
			.from("voters")
			.insert({
				first_name,
				last_name,
				other_name: middle_name,
				date_of_birth,
				email: email_address,
				occupation,
				phone_number,
				nin: Number(nin),
				origin_lga: lga_of_origin,
				origin_state: state_of_origin,
				home_addr: residential_address,
				home_state: state_of_residence,
				home_lga: lga_of_residence,
                _vin,
                gender,
                embeddings
			})
            .single();
        
        if (imageBlob) {
			const { error } = await supabase.storage.from("picture").upload(`/${_vin}/image`, imageBlob)	
			if (error) throw error
		}
		if (error) throw error

		return NextResponse.json(
			{ message: "Registration Sucessful!", success: true, _vin },
			{ status: 201 }
		);

	} catch (err) {
		return NextResponse.json(
			{ message: "An error occurred", error: err },
			{ status: 500 }
		);
	}
}
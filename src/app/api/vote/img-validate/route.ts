import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/utils/supabase";
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

async function generateOpenAIEmbeddings(profile: any) {
    const textToEmbed = Object.values(profile).join(' ');
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: textToEmbed,
    });
    return response.data[0].embedding;
}

export async function POST(req: NextRequest) {
    const { imageData } = await req.json();

    try {
        const imageBlob: Blob = await fetch(imageData).then((res) => res.blob());
        const embeddings = await generateOpenAIEmbeddings({ imageBlob })

        const { data, error } = await supabase.rpc('new_vector', {
            query_embedding: embeddings,
            similarity_threshold: 0.8,
            match_count: 2,
        });

        if (error || !data || data.length === 0) { 
            return NextResponse.json({ error, success: false, message: "Validation failed!" }, { status: 500 });
        }
        return NextResponse.json({ message: "Validation successful!", success: true, data: data[0] }, { status: 200 });
       
        
        
         
    } catch (error) { 
        return NextResponse.json({ error, success: false,  message: "Validation failed!" }, { status: 500 });
    }
    
    
	
}
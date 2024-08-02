"use client";
import { useState } from "react";
import {  printCardSchema } from "@/app/utils/lib";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import * as z from "zod";
import CardContent from "@/app/components/voter/CardContent";

type FormField = z.infer<typeof printCardSchema>;

export default function VoteCard() {
    const [showForm, setShowForm] = useState<boolean>(true);
    const [buttonClicked, setButtonClicked] = useState<boolean>(false);
    const [cardData, setCardData] = useState<CardDetails | null>(null);
	const { handleSubmit, register, formState } = useForm<FormField>({
		resolver: zodResolver(printCardSchema),
	});

    const onSubmit: SubmitHandler<FormField> = (data) => {
        setButtonClicked(true);
        postData(data);

    };
    
    const postData = async (data: FormField) => { 
        try {
            const response = await fetch("/api/vote/card", {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const { message, data } = await response.json();
                setShowForm(false);
                console.log({ message, data });
                setCardData(data);
               
            }
        }catch (error) {
            console.error("An error occurred", error);
            alert("Incorrect credentials, please try again");
        }
    }

    return (
        <>
            {showForm ? (

                	<main className='w-full h-screen flex flex-col items-center justify-center'>
			<h2 className='font-semibold text-2xl mb-3'>Print Voter&apos;s Card</h2>
			<form
				className='md:w-2/3 w-full p-3'
				onSubmit={handleSubmit(onSubmit)}
				noValidate
			>

				<label
					htmlFor='vin'
					className='block text-sm font-medium text-gray-700 mt-3'
				>
					Voter Identification Number
				</label>
				<input
					type='text'
					{...register("vin")}
					id='vin'
					className='mt-1 p-2 border border-gray-300 rounded-md w-full'
					placeholder='Enter your VIN'
				/>

				<p className='text-red-500 text-xs'>{formState.errors?.vin?.message}</p>

				<button
                            type='submit'
                            disabled={buttonClicked}
					className='w-full mb-2 font-semibold bg-green-500 text-white p-3 mt-3 rounded-md'
				>
					{buttonClicked ? "Printing..." : "Print Voter Card"}
                </button>
                
				<Link
					href='/vote/register'
					className='text-center block text-sm hover:underline '
				>
					Register as a Voter
				</Link>
			</form>
                </main>
                
            ) : (
                    <CardContent cardData={cardData} />
            )}
	
            </>
	);
}
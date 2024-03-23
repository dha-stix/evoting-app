"use client";
import { useState } from "react";

export default function Home() {
	const [vin, setVin] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [lastName, setLastName] = useState<string>("");

	return (
		<main className='p-8 flex items-center justify-center min-h-screen flex-col w-full'>
			<form className='flex flex-col md:w-2/3 w-full'>
				<h1 className='text-2xl font-bold text-green-700 text-center'>
					Voters&apos; Page
				</h1>
				<p className=' mb-8 text-center opacity-60 text-sm'>
					You can only log into the application during an election.
				</p>
				<label htmlFor='vin'>Voter&apos;s Identification Number (VIN)</label>
				<input
					type='text'
					id='vin'
					value={vin}
					onChange={(e) => setVin(e.target.value)}
					className='border-[1px] border-gray-600 rounded-md p-3 w-full mb-6'
				/>

				<label htmlFor='email'>Email Address</label>
				<input
					type='email'
					id='email'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className='border-[1px] border-gray-600 rounded-md p-3 w-full mb-6'
				/>

				<label htmlFor='lastname'>Last Name</label>
				<input
					type='text'
					id='lastname'
					value={lastName}
					onChange={(e) => setLastName(e.target.value)}
					className='border-[1px] border-gray-600 rounded-md p-3 w-full mb-6'
				/>

				<button className='bg-green-700 text-green-100 p-4 font-bold rounded'>
					Proceeed
				</button>
			</form>
		</main>
	);
}
"use client";
import { useState } from "react";

export default function Home() {
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");

	return (
		<main className='p-8 flex items-center justify-center min-h-screen flex-col w-full'>
			<form className='flex flex-col md:w-2/3 w-full'>
				<h1 className='text-2xl font-bold mb-8 text-green-700 text-center'>
					Admin Login
				</h1>
				<label htmlFor='email'>Email Address</label>
				<input
					type='email'
					id='email'
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className='border-[1px] border-gray-600 rounded-md p-3 w-full mb-6'
				/>

				<label htmlFor='password'>Password</label>
				<input
					type='password'
					id='password'
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className='border-[1px] border-gray-600 rounded-md p-3 w-full mb-6'
				/>

				<button className='bg-green-700 text-green-100 p-4 font-bold rounded'>
					Sign in
				</button>
			</form>
		</main>
	);
}
"use client";
import { adminFormSchema } from "@/app/utils/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as z from "zod";
import Cryptr from "cryptr";
const cryptr = new Cryptr(process.env.NEXT_PUBLIC_SECRET!);

type FormField = z.infer<typeof adminFormSchema>;


export default function Login() {
	const [buttonClicked, setButtonClicked] = useState<boolean>(false);
	const router = useRouter();
	const { handleSubmit, register, formState } = useForm<FormField>({
		resolver: zodResolver(adminFormSchema),
	});
	const {errors} = formState;

	const onSubmit: SubmitHandler<FormField> = data => { 
		setButtonClicked(true);
		const encryptedPassword = cryptr.encrypt(data.password);
		const encryptedEmail = cryptr.encrypt(data.email);
		postAuthData({email: encryptedEmail, password: encryptedPassword});
	}

	const postAuthData = async (data: FormField) => { 
		const response = await fetch("/api/users", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});
		const result = await response.json();
		sessionStorage.setItem("token", result.data);
		setButtonClicked(false);
		router.push("/admin/dashboard");
	}
	
	return (
		<main className='p-8 flex items-center justify-center min-h-screen flex-col w-full'>
			<form className='flex flex-col md:w-2/3 w-full'
				onSubmit={handleSubmit(onSubmit)}
				noValidate>
				<h1 className='text-2xl font-bold mb-8 text-green-700 text-center'>
					Admin Login
				</h1>
				<label htmlFor='email'>Email Address</label>
				<input
					type='email'
					id='email'
					{...register("email")}
					placeholder="asaoludavid234@gmail.com"
					className='border-[1px] border-gray-600 rounded-md p-3 w-full '
				/>
				<p className='text-red-500 text-xs'>{errors.email?.message}</p>

				<label htmlFor='password' className="mt-6">Password</label>
				<input
					type='password'
					id='password'
					{...register("password")}
					placeholder="dhastix080"
					className='border-[1px] border-gray-600 rounded-md p-3 w-full'
				/>
				<p className='text-red-500 text-xs  mb-6'>{errors.password?.message}</p>

				<button className='bg-green-700 text-green-100 p-4 font-bold rounded'
					type="submit"
					disabled={buttonClicked}>
					{buttonClicked ? "Signing in..." : "Sign in"}
				</button>
			</form>
		</main>
	);
}
"use client";
import { adminFormSchema } from "@/app/utils/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import * as z from "zod";

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
		postAuthData(data);
	}

	const postAuthData = async (data: FormField) => { 
		try {
			const response = await fetch("/api/users", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});
			const result = await response.json();
			if (!result.success) { 
				alert(result.message);
				setButtonClicked(false);
				return;
			}
			sessionStorage.setItem("token", JSON.stringify(result.data));
			setButtonClicked(false);
			router.push("/admin/dashboard");

		}catch (error) {
			console.error("An error occurred", error);
			setButtonClicked(false);
		}
		
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
					placeholder="admin@user.com"
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
				<Link
					href='/'
					className='mt-[5px] text-center block text-sm hover:underline '
				>
					Go Back
				</Link>
			</form>
		</main>
	);
}
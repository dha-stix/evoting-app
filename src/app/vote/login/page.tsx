"use client";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { votersFormSchema } from "@/app/utils/lib";
import { useState } from "react";
import * as z from "zod";
import ValidateVoterForm from "@/app/components/voter/ValidateVoterForm";
import ValidateImageForm from "@/app/components/voter/ValidateImageForm";

type FormField = z.infer<typeof votersFormSchema>;

export default function Login() {
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [confirmImage, setConfirmImage] = useState<boolean>(false);

	const { handleSubmit, register, formState, reset } = useForm<FormField>({
		resolver: zodResolver(votersFormSchema),
	});
	const { errors } = formState;

	const postData = async (data: FormField) => { 
		try {
			const request = await fetch("/api/vote/verify", {
				method: "POST",
				body: JSON.stringify(data),
				headers: {
					"Content-Type": "application/json",
				},
			});
			const response = await request.json();
			if (response.user || response.success) {
				setSubmitting(false);
				reset();
				setConfirmImage(true);
			} else {
				alert(response.message);
			}
			
		} catch (error) { 
			console.error(error);
		}
	}

	const onSubmit: SubmitHandler<FormField> = (data) => {
		setSubmitting(true);
		postData(data);
	
	};


	return (
		<main className='p-8 flex items-center justify-center min-h-screen flex-col w-full'>
			{confirmImage ? (
				<ValidateImageForm />
				

			): (
					<ValidateVoterForm handleSubmit={handleSubmit} register={register} errors={errors} onSubmit={onSubmit} submitting={submitting} />
					
			)}
			

		</main>
	);
}
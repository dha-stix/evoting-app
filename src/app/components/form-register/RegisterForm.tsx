"use client";

import { useState, useContext, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { VoterContext } from "@/app/context/VoterContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaForwardFast } from "react-icons/fa6";
import { schema } from '@/app/utils/lib';
import { useRouter } from "next/navigation";
import CopyVIN from "@/app/modals/CopyVIN";
import FormA from "./FormA";
import FormB from "./FormB";
import * as z from "zod";

type FormField = z.infer<typeof schema>;

export default function RegisterForm() {
	const { voterData, updateVoterData } = useContext(VoterContext);
	const [selectedState, setSelectedState] = useState<string>("");
	const [lgas, setLgas] = useState<string[]>([]);
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [vin, setVin] = useState<string>("");
	const [submitting, setSubmitting] = useState<boolean>(false);
	const [ondoLGAs, setOndoLGAs] = useState<string[]>([]);
	const [states, setStates] = useState<string[]>([]);
	const router = useRouter();

	const { handleSubmit, register, formState } = useForm<FormField>({
		resolver: zodResolver(schema),
	});

	useEffect(() => {
		async function fetchStates() {
			const response = await fetch("/states_lgs.json");
			const data = await response.json();
			const states = Object.keys(data);
			const allStates = ["", ...states];
			setStates(allStates);
		}
		fetchStates();
	}, []);

	useEffect(() => {
		if (!selectedState) return;
		async function fetchLgs() {
			const response = await fetch("/states_lgs.json");
			const data = await response.json();
			const lgs = data[selectedState!];
			const allLGAs = ["", ...lgs];
			setLgas(allLGAs);
		}
		fetchLgs();
	}, [selectedState]);

	useEffect(() => {
		async function fetchLgs() {
			const response = await fetch("/states_lgs.json");
			const data = await response.json();
			const lgs = data["Ondo"];
			const allLGAs = ["", ...lgs];
			setOndoLGAs(allLGAs);
		}
		fetchLgs();
	}, []);

	const { errors } = formState;

	const onSubmit: SubmitHandler<FormField> = (data) => {
		updateVoterData(data);
		if (!voterData.image_url) return alert("Please take a picture");
		setSubmitting(true);
		storeVoterData(data);
	};

	const storeVoterData = async (profile: any) => { 
		const response = await fetch("/api/register", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ ...profile, image_url: voterData.image_url }),
		});
		const data = await response.json();
		if (data._vin) {
			setIsOpen(true);
			setVin(data._vin);
		} else {
			alert(data.message)
			console.log(data);
		}
		setSubmitting(false);
	}

	return (
		<main className='w-full flex flex-col min-h-[80vh] items-center justify-center '>
			<form
				method='POST'
				className='md:w-5/6 w-full bg-[#F5F7F8] md:p-8 p-4 space-y-4 shadow-md'
				onSubmit={handleSubmit(onSubmit)}
				noValidate
			>
					<FormA
						register={register}
						errors={errors}
						states={states}
						selectedState={selectedState}
						setSelectedState={setSelectedState}
						lgas={lgas}
					/>
				
				 <FormB register={register} errors={errors} ondoLGAs={ondoLGAs}  />

				<div className='w-full  flex items-center space-x-4 justify-end mt-4'>
				
					<button
						type='submit'
						disabled={submitting}
						className={`px-3 flex items-center py-2 text-md bg-blue-500  text-white rounded-sm`}
					>
						{submitting ? "Registering..." : "Submit"}
						<FaForwardFast className='ml-2' />
					</button>
				</div>
			</form>
			<CopyVIN isOpen={isOpen} setIsOpen={setIsOpen} vin={vin} />
		</main>
	);
}
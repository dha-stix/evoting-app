import Link from "next/link";
interface Props {
	onSubmit: (data: any) => void;
	submitting: boolean;
	register: any;
	handleSubmit: any;
	errors: any;
}
export default function ValidateVoterForm({
	onSubmit,
	submitting,
	register,
	handleSubmit,
	errors,
}: Props) {
	return (
		<form
			className='flex flex-col md:w-2/3 w-full'
			onSubmit={handleSubmit(onSubmit)}
			noValidate
		>
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
				{...register("vin")}
				className='border-[1px] border-gray-600 rounded-md p-3 w-full'
			/>
			<p className='text-red-500 text-xs'>{errors?.vin?.message}</p>

			<label htmlFor='nin' className='mt-4'>
				National Identification Number (VIN)
			</label>
			<input
				type='text'
				id='nin'
				{...register("nin")}
				className='border-[1px] border-gray-600 rounded-md p-3 w-full'
			/>
			<p className='text-red-500 text-xs'>{errors?.nin?.message}</p>

			<label htmlFor='email' className='mt-4'>
				Email Address
			</label>
			<input
				type='email'
				id='email'
				{...register("email")}
				className='border-[1px] border-gray-600 rounded-md p-3 w-full'
			/>
			<p className='text-red-500 text-xs'>{errors?.email?.message}</p>

			<label htmlFor='date_of_birth' className='mt-4'>
				Date of Birth
			</label>
			<input
				type='date'
				id='date_of_birth'
				{...register("date_of_birth")}
				className='border-[1px] border-gray-600 rounded-md p-3 w-full'
			/>
			<p className='text-red-500 text-xs'>{errors?.date_of_birth?.message}</p>

			<button
				className='bg-green-700 text-green-100 p-4 font-bold rounded mt-4'
				disabled={submitting}
			>
				{submitting ? "Validating..." : "Proceeed"}
			</button>
			<Link
					href='/'
					className='mt-[5px] text-center block text-sm hover:underline '
				>
					Go Back
				</Link>
		</form>
	);
}
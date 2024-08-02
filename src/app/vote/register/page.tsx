import RegisterForm from "@/app/components/form-register/RegisterForm";

export default function Home() {
	return (
		<div className='w-full flex flex-col justify-center min-h-screen items-center p-3'>
			<div className='w-full md:w-5/6 mb-2'>
				<h3 className='text-center md:text-left font-bold text-2xl text-green-500'>
					Voter&apos;s Registration Form
				</h3>
				<p className='text-sm md:text-left text-center text-red-500'>
					Fill all fields as an eligible first time voter
				</p>
			</div>

			<RegisterForm />
		</div>
	);
}
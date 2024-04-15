import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
    isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	lastName: string,
	email: string
}

export default function PrintCardVerify({ isOpen, setIsOpen, lastName, email }: Props) {
    const [verificationCode, setVerificationCode] = useState<string>("");
	const closeModal = () => setIsOpen(false)
	const router = useRouter()

    const sendVerificationCode = async () => {
		try {
			const request = await fetch("/api/vote/verify", {
				method: "POST",
				body: JSON.stringify({ email, last_name: lastName, verificationCode}),
				 headers: {
                    "Content-Type": "application/json"
                }
			})
			const response = await request.json()
			if (!response.success) {
				return alert(response.message)	
			}
			closeModal();
			console.log(response.data)
			alert(`Your VIN is ${response.data.other._vin}`)
		} catch (err) {
			console.error(err)
		}
	}

    const handleFormCompletion = () => { 
        sendVerificationCode();
    }
	return (
		<>
			<Transition appear show={isOpen} as={Fragment}>
				<Dialog as='div' className='relative z-10' onClose={closeModal}>
					<Transition.Child
						as={Fragment}
						enter='ease-out duration-300'
						enterFrom='opacity-0'
						enterTo='opacity-100'
						leave='ease-in duration-200'
						leaveFrom='opacity-100'
						leaveTo='opacity-0'
					>
						<div className='fixed inset-0 bg-black/75' />
					</Transition.Child>

					<div className='fixed inset-0 overflow-y-auto'>
						<div className='flex min-h-full items-center justify-center p-4 text-center'>
							<Transition.Child
								as={Fragment}
								enter='ease-out duration-300'
								enterFrom='opacity-0 scale-95'
								enterTo='opacity-100 scale-100'
								leave='ease-in duration-200'
								leaveFrom='opacity-100 scale-100'
								leaveTo='opacity-0 scale-95'
							>
								<Dialog.Panel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
									<Dialog.Title
										as='h3'
										className='text-lg font-medium leading-6 text-gray-900 mb-3'
									>
										Enter the verification code
									</Dialog.Title>
									<Dialog.Description className='text-sm text-red-500'>
										Please check your email for the verification code. <br/> Don&apos;t click outside this whitespace
									</Dialog.Description>
									<form className='mt-2'>
										<label htmlFor='code' className="text-sm">Verification Code </label>
										<input
											id='code'
											type='text'
                                            className='w-full px-6 py-3 border-[1px] border-gray-500 rounded-md'
                                            required
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                        />
                                        <div className='mt-4'>
										<button
											type='button'
											className='inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2'
											onClick={handleFormCompletion}
										>
											Confirm Code
										</button>
									</div>
									</form>

									
								</Dialog.Panel>
							</Transition.Child>
						</div>
					</div>
				</Dialog>
			</Transition>
		</>
	);
}
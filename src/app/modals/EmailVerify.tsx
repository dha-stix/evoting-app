import { Dialog, DialogTitle, DialogPanel, Transition, Description, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";

interface Props { 
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
}

export default function CopyVIN({ isOpen, setIsOpen }: Props) {
	const closeModal = () => setIsOpen(false)
	

	return (
		<>
			<Transition appear show={isOpen} as={Fragment}>
				<Dialog as='div' className='relative z-10' onClose={closeModal}>
					<TransitionChild
						as={Fragment}
						enter='ease-out duration-300'
						enterFrom='opacity-0'
						enterTo='opacity-100'
						leave='ease-in duration-200'
						leaveFrom='opacity-100'
						leaveTo='opacity-0'
					>
						<div className='fixed inset-0 bg-black/75' />
					</TransitionChild>

					<div className='fixed inset-0 overflow-y-auto'>
						<div className='flex min-h-full items-center justify-center p-4 text-center'>
							<TransitionChild
								as={Fragment}
								enter='ease-out duration-300'
								enterFrom='opacity-0 scale-95'
								enterTo='opacity-100 scale-100'
								leave='ease-in duration-200'
								leaveFrom='opacity-100 scale-100'
								leaveTo='opacity-0 scale-95'
							>
								<DialogPanel className='w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all'>
									<DialogTitle
										as='h3'
										className='text-lg font-medium leading-6 text-gray-900 mb-3'
									>
										Enter your verification code
									</DialogTitle>
									<Description className='text-sm text-red-500'>
										Please check your email for the verification code. <br/> Don&apos;t click outside this whitespace
									</Description>

									
								</DialogPanel>
							</TransitionChild>
						</div>
					</div>
				</Dialog>
			</Transition>
		</>
	);
}
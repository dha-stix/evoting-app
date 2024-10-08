import {
	Dialog,
	DialogTitle,
	DialogPanel,
	Transition,
	Description,
	TransitionChild,
} from "@headlessui/react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Fragment, useState } from "react";
import Link from "next/link";

interface Props {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
	vin: string;
}

export default function CopyVIN({ isOpen, setIsOpen, vin }: Props) {
	const [copied, setCopied] = useState<boolean>(false);
	const handleCopy = () => setCopied(true);
	const closeModal = () => setIsOpen(false);

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
								<DialogPanel className='w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 align-middle shadow-xl transition-all text-center'>
									<DialogTitle
										as='h3'
										className='text-lg font-medium leading-6 text-gray-900'
									>
										Registration Successful! 🎉
									</DialogTitle>
									<Description className='text-sm mb-2 text-red-500'>
										Ensure your save the VIN in a secure place
									</Description>

									<CopyToClipboard onCopy={handleCopy} text={vin}>
										<h3 className='font-bold text-2xl'>{vin}</h3>
									</CopyToClipboard>

									{copied && (
										<div>
											<p className='text-sm text-green-500 mb-3'>Copied</p>

											<Link
												href='/vote/card'
												className='text-blue-500 underline'
											>
												Print Voter Card
											</Link>
										</div>
									)}
								</DialogPanel>
							</TransitionChild>
						</div>
					</div>
				</Dialog>
			</Transition>
		</>
	);
}
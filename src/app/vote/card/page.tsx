"use client";
import React, { useState } from "react";
import PrintCardVerify from "@/app/modals/PrintCardVerify";

export default function Home() {
	const [email, setEmail] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [disableBtn, setDisableBtn] = useState<boolean>(false)
  const [openModal, setOpenModal] = useState<boolean>(false)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendCredentialsToServer()

  }
  const sendCredentialsToServer = async () => {
    try { 
      const request = await fetch(`/api/vote/verify?email=${email}&lastName=${lastName}`)
      const response = await request.json()
      if (response.success) {
        setDisableBtn(true)
        setOpenModal(true)
      }
    } catch (err) {
      console.error(err)
    }
  }


	return (
		<main className='p-8 flex items-center justify-center min-h-screen flex-col w-full'>
			<form className='flex flex-col md:w-2/3 w-full' onSubmit={handleSubmit}>
				<h1 className='text-2xl font-bold mb-8 text-green-700 text-center'>
					Print Voter&apos;s Card
				</h1>
				<label htmlFor='email'>Email Address</label>
				<input
					type='email'
					id='email'
          value={email}
          required
					onChange={(e) => setEmail(e.target.value)}
					className='border-[1px] border-gray-600 rounded-md p-3 w-full mb-6'
				/>
        
        <label htmlFor='lastname'>Last Name</label>
				<input
					type='text'
          id='lastname'
          required
					value={lastName}
					onChange={(e) => setLastName(e.target.value)}
					className='border-[1px] border-gray-600 rounded-md p-3 w-full mb-6'
				/>

				<button className='bg-green-700 text-green-100 p-4 font-bold rounded' disabled={disableBtn}>
					{disableBtn ? "Code Sent!" : "Print Voters Card"}
				</button>
      </form>
      <PrintCardVerify isOpen={openModal} setIsOpen={setOpenModal} lastName={lastName} email={email} />
		</main>
	);
}
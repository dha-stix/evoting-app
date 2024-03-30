"use client";
import { useEffect, useRef, useState } from "react";
import EmailVerify from "@/modals/EmailVerify";

export default function Home() {
	const [ondoLGAs, setOndoLGAs] = useState([]);
	const [allStates, setAllStates] = useState<string[]>([]);
	const [origins, setOrigins] = useState({ state: "", lga: "" });
	const [names, setNames] = useState({
		firstName: "",
		lastName: "",
		otherName: "",
	});
	const [email, setEmail] = useState<string>("");
	const [dob, setDOB] = useState<string>();
	const [occupation, setOccupation] = useState<string>("");
	const [allLGA, setAllLGA] = useState<string[]>([]);
	const [nin, setNin] = useState<string>("");
	const [imageData, setImageData] = useState<string>("");
	const [homeAddr, setHomeAddr] = useState<string>("")
	const [addrState, setAddrState] = useState<string>("")
	const [addrLGA, setAddrLGA] = useState<string>("")
	const [addrZone, setAddrZone] = useState<string>("")
 	const videoRef = useRef<HTMLVideoElement | any>();
	const photoRef = useRef<HTMLCanvasElement | any>();
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [propsData, setPropsData] = useState<string>("");
	const [disableButton, setDisableButton] = useState<boolean>(false);
	

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!addrLGA || !addrState || !origins.lga || !origins.state)
			return alert("Please ensure you fill all the fields!");
		if (!Number(nin) || nin.length !== 11) {
			return alert("NIN invalid!, please try again");
		}
		if (!imageData) { 
			return alert("Please take a picture!");
		}
		setIsOpen(true);

		const propsData = JSON.stringify({ names, email, dob, occupation, nin, addrLGA, addrState, addrZone, homeAddr, origins, imageData })
		setPropsData(propsData)
		sendEmail(email)
		setDisableButton(true)
	};

	const sendEmail = async (email: string) => {
		try {
			const response = await fetch(`/api/email?email=${email}`);
			const data = await response.json();
			if (response.ok) {
				alert(data.message);
			}
		} catch (err) {
			console.error(err);
		}
		
		
	 }

	const getUserCamera = () => {
		navigator.mediaDevices
			.getUserMedia({ video: true })
			.then((stream) => {
				let video = videoRef.current;
				if (video) {
					video.srcObject = stream;
					video.play();
				}
			})
			.catch((error) => {
				console.log(error);
			});
	};

	useEffect(() => {
		getUserCamera();
	}, [videoRef]);

	const takePicture = (e: React.FormEvent) => {
		e.preventDefault()
		const width = 200;
		const height = width / (16 / 9);
		const photo = photoRef.current;
		const video = videoRef.current;
		if (photo && video) {
			photo.width = width;
			photo.height = height;
			const ctx = photo.getContext("2d");
			if (ctx) {
				ctx.drawImage(video, 0, 0, photo.width, photo.height);
				const imageDataURL = photo.toDataURL("image/jpeg");
				const base64Data = imageDataURL.split(",")[1];
				setImageData(imageDataURL);
			}
		}
	};

	useEffect(() => {
		async function fetchStates() {
			const response = await fetch("/states_lgs.json");
			const data = await response.json();
			if (data.Ondo) {
				setOndoLGAs(data.Ondo);
				const states = Object.keys(data);
				const allStates = ["Select", ...states];
				setAllStates(allStates);
			}
		}
		fetchStates();
	}, []);

	useEffect(() => {
		async function fetchLGAs() {
			if (origins.state) {
				const response = await fetch("/states_lgs.json");
				const data = await response.json();
				if (data) {
					const allLGAs = ["Select", ...data[origins.state]];
					setAllLGA(allLGAs);
				}
			}
		}
		fetchLGAs();
	}, [origins]);

	return (
		<main className='p-8 flex min-h-screen flex-col w-full'>
			<h2 className='text-2xl md:text-left text-center font-bold mb-8 text-green-700'>
				Voter&apos;s Registration Form
			</h2>

			<form onSubmit={handleSubmit}>
				<header className='w-full flex md:flex-row flex-col items-center md:mb-4'>
					<div className='md:w-1/5 w-full flex flex-col items-center md:px-2'>
						<div className='md:w-full w-2/3 h-[200px] mb-3'>
							<video ref={videoRef} className='w-full h-full'></video>
						</div>
						<button
							className='px-4 py-2 bg-green-700 text-green-50'
							onClick={takePicture}
						>
							Take Picture
						</button>

						<canvas
							ref={photoRef}
							className='md:w-full w-2/3 h-[200px] '
						></canvas>
					</div>

					<div className='md:w-4/5 w-full md:px-8'>
						<label htmlFor='firstName'>First Name</label>
						<input
							className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
							id='firstName'
							type='text'
							required
							value={names.firstName}
							onChange={(e) =>
								setNames({ ...names, firstName: e.target.value })
							}
						/>
						<label htmlFor='lastName'>Last Name</label>
						<input
							className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
							id='lastName'
							type='text'
							required
							value={names.lastName}
							onChange={(e) => setNames({ ...names, lastName: e.target.value })}
						/>
						<label htmlFor='otherName'>Other Name</label>
						<input
							className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
							id='otherName'
							type='text'
							value={names.otherName}
							onChange={(e) =>
								setNames({ ...names, otherName: e.target.value })
							}
						/>
					</div>
				</header>

				<main className='w-full'>
					<div className='w-full flex md:flex-row flex-col'>
						<section className='lg:w-1/3 w-full md:px-3'>
							<label htmlFor='email'>Email Address</label>
							<input
								className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
								id='otherName'
								type='email'
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</section>
						<section className='lg:w-1/3 w-full md:px-3'>
							<label htmlFor='dob'>Date of Birth</label>
							<input
								className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
								id='dob'
								type='date'
								max={`${new Date().getFullYear() - 18}-12-31`}
								required
								value={dob}
								onChange={(e) => setDOB(e.target.value)}
							/>
						</section>
						<section className='lg:w-1/3 w-full md:px-3'>
							<label htmlFor='occupation'>Occupation</label>
							<input
								className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
								id='occupation'
								type='text'
								required
								value={occupation}
								onChange={(e) => setOccupation(e.target.value)}
							/>
						</section>
					</div>

					<div className='w-full flex md:flex-row flex-col mb-4'>
						<section className='lg:w-1/3 w-full md:px-3'>
							<label htmlFor='or_state'>State of Origin</label>
							<select
								className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
								id='or_state'
								required
								value={origins.state}
								onChange={(e) =>
									setOrigins({ ...origins, state: e.target.value })
								}
							>
								{allStates.map((state) => (
									<option key={state} value={state}>
										{state}
									</option>
								))}
							</select>
						</section>
						<section className='lg:w-1/3 w-full md:px-3'>
							<label htmlFor='or_lga'>LGA of Origin</label>
							<select
								className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
								id='or_lga'
								required
								value={origins.lga}
								onChange={(e) =>
									setOrigins({ ...origins, lga: e.target.value })
								}
							>
								{allLGA.map((lga) => (
									<option key={lga} value={lga}>
										{lga}
									</option>
								))}
							</select>
						</section>

						<section className='lg:w-1/3 w-full md:px-3'>
							<label htmlFor='nin'>National Identification Number (NIN)</label>
							<input
								className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
								id='nin'
								type='text'
								required
								maxLength={11}
								value={nin}
								onChange={(e) => setNin(e.target.value)}
							/>
						</section>
					</div>

					<h3 className='text-2xl font-semibold text-green-500 mb-4'>
						Contact Details
					</h3>

					<label htmlFor='homeAddress'>Home Address</label>
					<input
						className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
						id='homeAddress'
						type='text'
						required
						value={homeAddr}
						onChange={(e) => setHomeAddr(e.target.value)}
					/>
					<div className='w-full flex md:flex-row flex-col mb-8'>
						<section className='lg:w-1/2 w-full md:px-3'>
							<label htmlFor='res_state'>State of Residence</label>
							<select
								className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
								id='res_state'
								required
								value={addrState}
								onChange={(e) => setAddrState(e.target.value)}
							>
								<option value=''>Select</option>
								<option value='ondo'>Ondo State</option>
							</select>
						</section>

						<section className='lg:w-1/2 w-full md:px-3'>
							<label htmlFor='res_lga'>LGA of Residence</label>
							<select
								className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
								id='res_lga'
								required
								value={addrLGA}
								onChange={(e) => setAddrLGA(e.target.value)}
							>
								{ondoLGAs.map((lga) => (
									<option key={lga} value={lga}>
										{lga}
									</option>
								))}
							</select>
						</section>

						<section className='lg:w-1/2 w-full md:px-3'>
							<label htmlFor='geo_zone'>Geo-political Zone</label>
							<select
								required
								className='w-full border-[1px] px-6 py-3 border-gray-500 mb-3'
								id='geo_zone'
								value={addrZone}
								onChange={(e) => setAddrZone(e.target.value)}
							>
								<option value=''>Select</option>
								<option value='SW'>South West</option>
							</select>
						</section>
					</div>

					<button className='bg-green-700 text-green-50 font-semibold w-full p-4 rounded-md' disabled={disableButton}>
						{disableButton ? "Code Sent...Please wait!..." :"Submit Data"}
					</button>
				</main>
			</form>
			<EmailVerify isOpen={isOpen} setIsOpen={setIsOpen} propsData={propsData} />
		</main>
	);
}
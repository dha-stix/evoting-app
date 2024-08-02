"use client";
import { useRef, useEffect, useState, useContext } from "react";
import { VoterContext } from "@/app/context/VoterContext";

export default function FormB({
	register,
	errors,
	ondoLGAs,
}: {
	register: any;
	errors: any;
	ondoLGAs: string[];
}) {
	const [imageData, setImageData] = useState<string>("");
	const videoRef = useRef<HTMLVideoElement | any>();
	const photoRef = useRef<HTMLCanvasElement | any>();
	const { updateVoterData } = useContext(VoterContext);

	const getUserCamera = () => {
		navigator.mediaDevices
			.getUserMedia({ video: true })
			.then((stream) => {
				let video = videoRef.current;
				if (video) {
					video.srcObject = stream;
					const playPromise = video.play();
					if (playPromise !== undefined) {
						playPromise
							.then((playing: any) => {
								console.log("Video is playing", playing);
							})
							.catch((error: any) => {
								console.log("Video is paused", error);
							});
					}
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
		e.preventDefault();
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
				setImageData(imageDataURL);
				updateVoterData({ image_url: imageDataURL});
			}
		}
	};

	return (
		<>
			<div className='w-full flex md:flex-row flex-col items-center space-y-4 md:space-y-0 md:space-x-4 space-x-0'>
				<div className='md:w-1/2 w-full'>
				<label className='text-sm' htmlFor='firstName'>
					Full Residential Address
				</label>
				<input
					className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
					type='text'
					{...register("residential_address")}
					id='firstName'
					required
				/>
				<p className='text-red-500 text-xs'>
					{errors.residential_address?.message}
				</p>
				</div>
				<div className='md:w-1/2 w-full'>
				<label className='text-sm' htmlFor='gender'>
					Gender
				</label>
				<select
						id='gender'
						required
						{...register("gender")}
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
					>
						<option value=''>Select</option>
						<option value='Male'>Male</option>
						<option value='Female'>Female</option>
					</select>
				<p className='text-red-500 text-xs'>
					{errors.gender?.message}
				</p>
				</div>
			</div>
			

			<div className='w-full flex md:flex-row flex-col items-center space-y-4 md:space-y-0 md:space-x-4 space-x-0'>
				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor='res_state'>
						State of Residence
					</label>
					<select
						id='res_state'
						required
						{...register("state_of_residence")}
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
					>
						<option value=''>Select</option>
						<option value='ondo'>Ondo State </option>
					</select>
					<p className='text-red-500 text-xs'>
						{errors.state_of_residence?.message}
					</p>
				</div>

				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor='res_lga'>
						LGA of Residence
					</label>
					<select
						id='res_lga'
						required
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
						{...register("lga_of_residence")}
					>
						{ondoLGAs.map((lga) => (
							<option key={lga} value={lga}>
								{lga}
							</option>
						))}
					</select>
					<p className='text-red-500 text-xs'>
						{errors.lga_of_residence?.message}
					</p>
				</div>
			</div>

			<div className=' w-full flex justify-between items-center md:px-2 p-6'>
				<div className='md:w-full w-2/3 h-[150px] mb-3 flex items-center flex-col'>
					<video ref={videoRef} className='w-full h-full'></video>
					<button
						className='px-4 py-2 mt-3 bg-green-700 text-green-50'
						onClick={takePicture}
					>
						Take Passport
					</button>
				</div>
				<canvas
					ref={photoRef}
					className='md:w-full w-[100px] h-[200px] border-[1px] border-gray-300'
				></canvas>
			</div>
		</>
	);
}
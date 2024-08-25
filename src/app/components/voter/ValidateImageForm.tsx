"use client"
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export default function ValidateImageForm() {
	const [imageData, setImageData] = useState<string>("");
	const videoRef = useRef<HTMLVideoElement | any>();
	const photoRef = useRef<HTMLCanvasElement | any>();
	const router = useRouter();

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
				console.log({ image_url: imageDataURL});
			}
		}
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Image submitted");
		console.log({ imageData })
		router.push("/vote/ballot");
     }
    
    return (
        <form className=" md:w-2/3 w-full flex flex-col items-center justify-center" onSubmit={handleSubmit}>
            <h2 className="font-bold text-2xl text-center text-green-600">Validate Identity</h2>
            <p className="text-center text-sm opacity-75">Before voting, we need to confirm your identity. Take a snapshot of yourself</p>
          
            <div className=' w-full flex justify-between items-center md:px-2 p-6 space-x-4 mb-6'>
                
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
            
            <button className="p-3 bg-gray-600 text-green-50 block text-center rounded-md w-[200px]">Proceed</button>
        </form>
    )
}
"use client";
import { useState, useEffect } from "react";

interface CountdownProps {
	startDateStr: string;
	endDateStr: string;
	id: number;
}

const formatTime12Hour = (dateStr: string): string => {
	const timePart = dateStr.split(" ")[1];
	const [hours, minutes] = timePart.split(":").map(Number);
	const ampm = hours >= 12 ? "pm" : "am";
	const hours12 = hours % 12 || 12;

	// Format the time string
	const formattedTime = `${hours12}:${minutes
		.toString()
		.padStart(2, "0")}${ampm}`;

	return formattedTime;
};

const handleStopElection = async (id: number) => {
	const request = await fetch("/api/elections", {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ id, status: "Ended" }),
	});
	const response = await request.json();
	if (!response.success) {
		alert(response.message);
		return;
	}
	alert(response.message);
};

const Countdown: React.FC<CountdownProps> = ({
	startDateStr,
	endDateStr,
	id,
}) => {
	const [timeRemaining, setTimeRemaining] = useState<string>("");

	useEffect(() => {
		function updateCountdown() {
			const startDate = new Date(startDateStr);
			const endDate = new Date(endDateStr);
			const now = new Date();

			// Check if the start date is the same day as today
			const isSameDay =
				startDate.getFullYear() === now.getFullYear() &&
				startDate.getMonth() === now.getMonth() &&
				startDate.getDate() === now.getDate();

			// Use the current time as the start date if it's the same day
			const effectiveStartDate = isSameDay ? now : startDate;

			// Calculate the difference in milliseconds
			const diffMs = endDate.getTime() - effectiveStartDate.getTime();

			if (diffMs <= 0) {
				handleStopElection(id);
				setTimeRemaining("Time's up!");
				return;
			}

			// Calculate hours, minutes, and seconds
			const hours = Math.floor(diffMs / (1000 * 60 * 60));
			const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

			// Update the time remaining state
			setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
		}

		// Update countdown every second
		const intervalId = setInterval(updateCountdown, 1000);

		// Initial call to display the countdown immediately
		updateCountdown();

		// Cleanup interval on component unmount
		return () => clearInterval(intervalId);
	}, [startDateStr, endDateStr, id]);

	return <p className='text-sm font-bold'>{timeRemaining}</p>;
};

export default function RecentElections({
	elections,
}: {
	elections: Election[];
}) {
	return (
		<div>
			{elections.map((election) => (
				<div
					className='flex w-full px-6 py-4 mb-2 rounded-md items-center justify-between border-[1px]'
					key={election.id}
				>
					<div className="w-1/2">
						<h3 className=' font-bold'>{election.description}</h3>
						<p className='text-sm opacity-65'>{election.name}</p>
					</div>
					<div>
						{election.active && (
							<>
								<p className='text-sm'>Time Remaining</p>
								<Countdown
									startDateStr={election.start_date!}
									endDateStr={election.end_date!}
									id={election.id}
								/>
							</>
						)}

						<p className='text-sm opacity-65'>
							Started at {formatTime12Hour(election.start_date!)}
						</p>
          </div>

          <button className='bg-blue-500 text-sm text-white p-2 rounded-md'>View Election Results</button>
          
					<button
						className='bg-red-500 text-sm text-white px-2 py-1 rounded-md'
						disabled={!election.active}
						onClick={() => handleStopElection(election.id)}
					>
						{election.active ? "Stop" : "Ended"}
					</button>
				</div>
			))}
		</div>
	);
}
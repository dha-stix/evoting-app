"use client";
import { useState } from "react";
import { capitalize, electionTypes } from "@/app/utils/lib";

export default function ElectionContent() {
	const [description, setDescription] = useState<string>("");
	const [showForm, setShowForm] = useState<boolean>(false);
	const [formCandidates, setFormCandidates] = useState<FormCandidates[]>([]);
	const [electionTobeStarted, setElectionTobeStarted] =
		useState<Election | null>(null);

	const formatDateTime = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		const seconds = String(date.getSeconds()).padStart(2, "0");
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	};

	const getCurrentDateTime = (): string => {
		const now = new Date();
		return formatDateTime(now);
	};

	const getEndDateTime = (): string => {
		const now = new Date();
		now.setHours(now.getHours() + 6);
		return formatDateTime(now);
	};

	const handleStartElection = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (formCandidates.length === 0) {
			alert("No candidates available for this election");
			return;
		}
		if (!electionTobeStarted) return;
		const newElection: Election = {
			...electionTobeStarted,
			candidates: formCandidates,
			description,
			start_date: getCurrentDateTime(),
			end_date: getEndDateTime(),
			status: "In Progress",
			active: true,
		};
		const request = await fetch("/api/elections", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(newElection),
		});
		const response = await request.json();
		if (!response.success) {
			alert(response.message);
			return;
		}
		alert(response.message);
		setDescription("");
		setShowForm(false);
	};

	const fetchCandidates = async (type: Election["type"]) => {
		const request = await fetch("/api/candidates");
		const response = await request.json();
		if (response.success) {
			if (type === "sen") {
				setFormCandidates(response.senators);
			} else {
				setFormCandidates(response.governors);
			}
		}
	};

	const toggleElection = (election: Election) => {
		fetchCandidates(election.type);
		setShowForm(true);
		setElectionTobeStarted(election);
	};

	return (
		<div>
			<h2 className='font-bold text-xl text-green-600'>Start an Election</h2>
			<p className='text-sm mb-4'>
				Create your Senatorial and Governorship elections with AuthVote
			</p>
			<div className='w-full'>
				<table className='w-full border-collapse table-auto'>
					<thead>
						<tr>
							<th>Type</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{electionTypes.map((election) => (
							<tr key={election.id}>
								<td className='text-sm'>{election.name}</td>
								<td className='text-sm'>
									<button
										className="bg-green-500 hover:bg-gray-500 text-white px-2 py-1 rounded-md"
										onClick={() => toggleElection(election)}
									>
										Start
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{showForm && (
				<section className='w-full mt-6'>
					<h2 className='text-lg font-bold text-green-600'>
						Enter Election Details
					</h2>
					<form className='w-full' onSubmit={handleStartElection}>
						<label htmlFor='title' className='text-sm'>
							Description
						</label>
						<input
							className='border-[1px] w-full px-4 py-2 rounded-sm text-sm mb-3'
							required
							value={description}
							onChange={(e) => setDescription(e.target.value)}
						/>
						<p className='text-sm'>Candidates</p>
						<div className='border-[1px] w-full rounded-sm p-3 mb-3'>
							{formCandidates.map((candidate) => (
								<p className='text-sm' key={candidate.id}>{`${
									candidate.name
								} - ${candidate.party} ${capitalize(candidate.sen_type)}`}</p>
							))}
						</div>
						<button className='bg-gray-600 p-3 text-green-50 font-bold rounded w-full'>
							Kickstart Election
						</button>
					</form>
				</section>
			)}
		</div>
	);
}
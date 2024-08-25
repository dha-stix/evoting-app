"use client";
import { ondoSenatorialDistricts } from "@/app/utils/lib";
import { MdDelete } from "react-icons/md";
import { Dispatch, SetStateAction, useState } from "react";

interface Props {
    parties: Party[],
    senators: Candidate[],
	governors: Candidate[],
	setGovernors: Dispatch<SetStateAction<Candidate[]>>;
	setSenators: Dispatch<SetStateAction<Candidate[]>>;
}

const changeToTitleCase = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function CandidateContent({ parties, senators, governors, setGovernors, setSenators }: Props) {
    const [candidateName, setCandidateName] = useState<string>("");
    const [adding, setAdding] = useState<boolean>(false);
	const [electionType, setElectionType] = useState<string>("");
	const [party, setParty] = useState<string>("");
	const [district, setDistrict] = useState<string>("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        setAdding(true);
		e.preventDefault();
		if(electionType === "sen" && district === "") {
            return alert("Senatorial District is required");
        }
        createCandidate();
    };
    
    const createCandidate = async () => { 
        try {
            const response = await fetch("/api/candidates", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ candidateName, electionType, party, district }),
            });
            const data = await response.json();
            alert(data.message);
			setAdding(false);
			setCandidateName("")
			setParty("")
			setDistrict("")
			setElectionType("")
        } catch (error) {
            console.error(error);
            setAdding(false);
        }
	}
	
	const deleteCandidate = async (id: number) => { 
        try {
            const response = await fetch("/api/candidates", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
				body: JSON.stringify({ id }),
            });
			const data = await response.json();
			return data.success
        } catch (error) {
            console.error(error);
			setAdding(false);
        }
	}

    const handleDeleteCandidate = async (id: number, candidates: Candidate[], type: string) => { 
		const status = await deleteCandidate(id)
		if (!status) return;
	
			if (type === "sen") {
			const data = candidates.filter(candidate => candidate.id !== id);
			setSenators(data)
			
		} else {
			const data = candidates.filter(candidate => candidate.id !== id);
			setGovernors(data)
		}	
		
	}

	return (
		<div>
			<h2 className='font-bold text-xl text-green-600'>Candidates</h2>
			<p className='text-sm mb-8'>
				List of candidates vying for the Senatorial and Governorship positions
			</p>

			<form className='w-full mb-10' onSubmit={handleSubmit}>
				<section className='flex items-center mb-3 space-x-3'>
					<div className='w-1/2'>
						<label htmlFor='name' className='text-sm'>
							Candidate&apos;s Name
						</label>
						<input
							type='text'
							id='name'
							required
							className='w-full border-[1px] px-4 py-2 rounded text-sm border-gray-200'
							value={candidateName}
							onChange={(e) => setCandidateName(e.target.value)}
						/>
					</div>

					<div className='w-1/2'>
						<label htmlFor='party' className='text-sm'>
							Candidate&apos;s Party
						</label>
						<select
							className='w-full border-[1px] px-4 py-2 rounded text-sm border-gray-200'
							id='party'
							required
							value={party}
							onChange={(e) => setParty(e.target.value)}
						>
							{parties.map((party) => (
								<option key={party.id} value={party.acronym}>
									{party.name}
								</option>
							))}
						</select>
					</div>
				</section>

				<section className='flex items-center mb-3 space-x-3'>
					<div className='w-1/2'>
						<label htmlFor='type' className='text-sm'>
							Election Type
						</label>
						<select
							className='w-full border-[1px] px-4 py-2 rounded text-sm border-gray-200'
							id='type'
							required
							value={electionType}
							onChange={(e) => setElectionType(e.target.value)}
						>
							<option value=''>Select</option>
							<option value='sen'>Senatorial District</option>
							<option value='gov'>Governorship</option>
						</select>
					</div>

					{electionType === "sen" && (
						<div className='w-1/2'>
							<label htmlFor='district' className='text-sm'>
								Senatorial District
							</label>
							<select
								className='w-full border-[1px] px-4 py-2 rounded text-sm border-gray-200'
								id='district'
								required
								value={district}
								onChange={(e) => setDistrict(e.target.value)}
							>
								{ondoSenatorialDistricts.map((district) => (
									<option key={district.id} value={district.id}>
										{district.name}
									</option>
								))}
							</select>
						</div>
					)}
				</section>

				<button className='bg-green-600 text-white px-4 py-2 rounded' disabled={adding}>
					{adding ? "Adding..." : "Add Candidate"}
				</button>
			</form>

			<h2 className='font-bold text-xl text-red-600'>Senatorial Candidates</h2>

			<div className='w-full mb-10'>
				<table className='w-full border-collapse table-auto'>
					<thead>
						<tr>
							<th>Names</th>
							<th>Party</th>
                            <th>District</th>
                            <th>Action</th>
						</tr>
					</thead>
                    <tbody>
                        {senators.map((senator) => (
                            <tr key={senator.id}>
                                <td className='md:text-sm text-xs'>{senator.name}</td>
                                <td className='md:text-sm text-xs'>{senator.party}</td>
                                <td className='md:text-sm text-xs'>Ondo {changeToTitleCase(senator.sen_type!)}</td>
                                <td><MdDelete className="text-red-500 text-lg cursor-pointer" onClick={() => handleDeleteCandidate(senator.id, senators, "sen")}/></td>
                            </tr>
                        ))}
						
					
					</tbody>
				</table>
			</div>

			<h2 className='font-bold text-xl text-red-600'>
				Governorship Candidates
			</h2>

			<div className='w-full'>
				<table className='w-full border-collapse table-auto'>
					<thead>
						<tr>
							<th>Names</th>
							<th>Party</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
                        {governors.map((governor) => (
                            <tr key={governor.id}>
                                <td className='md:text-sm text-xs'>{governor.name}</td>
                                <td className='md:text-sm text-xs'>{governor.party}</td>
                                <td><MdDelete className="text-red-500 text-lg cursor-pointer" onClick={() => handleDeleteCandidate(governor.id, governors, "gov")}/></td>
                            </tr>
                            
                        ))}
						
					</tbody>
				</table>
			</div>
		</div>
	);
}
import { determineLGA } from "@/app/utils/lib";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
	user: User | null;
	governorshipElection: Election | null;
	senatorialElection: Election | null;
}

export default function Ballot({
	user,
	governorshipElection,
	senatorialElection,
}: Props) {
	const [senatorialCandidates, setSenatorialCandidates] = useState<
		FormCandidates[] | null
    >(null);
  const router = useRouter()
  
  const [senator, setSenator] = useState<string>("");
  const [governor, setGovernor] = useState<string>("")

	useEffect(() => {
		const updateSenatorialCandidates = () => {
			if (!user || !senatorialElection || !senatorialElection.candidates)
				return null;
			const candidates = senatorialElection?.candidates.filter(
				(candidate) => candidate.sen_type === determineLGA(user?.home_lga!)
			);
			setSenatorialCandidates(candidates);
		};
		updateSenatorialCandidates();
  }, [user, senatorialElection]);
  
  const handleGovernorshipVoting = async (e: React.FormEvent<HTMLFormElement>) => { 
    e.preventDefault();
     const body = JSON.stringify({
      name: governor,
      party: governorshipElection?.candidates?.find(candidate => candidate.name === governor)?.party,
       voter_id: user?.id,
       sen_type: null,
       election: governorshipElection?.id,
      type: governorshipElection?.type
     }) 
    const request = await fetch("/api/elections/active", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body
    })
    const response = await request.json()
    alert(response.message)
    localStorage.removeItem("_user_")
    router.push("/")

  }

  const handleSenatorialVoting = async (e: React.FormEvent<HTMLFormElement>) => { 
    e.preventDefault();
    const body = JSON.stringify({
      name: senator,
      party: senatorialCandidates?.find(candidate => candidate.name === senator)?.party,
      voter_id: user?.id,
      sen_type: senatorialCandidates?.find(candidate => candidate.name === senator)?.sen_type,
      election: senatorialElection?.id,
      type: senatorialElection?.type
    })

    const request = await fetch("/api/elections/active", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body
    })
    const response = await request.json()
    alert(response.message)
    localStorage.removeItem("_user_")
    router.push("/")
  }


	return (
		<main className=''>
			<div className='w-full border-[1px] rounded border-gray-600 p-3'>
				<Tabs variant='enclosed'>
					<TabList>
						{senatorialElection && (
							<Tab className='font-bold'>Senatorial District Ballot</Tab>
						)}
						{governorshipElection && (
							<Tab className='font-bold'>Governorship Ballot</Tab>
						)}
          </TabList>
          
					<TabPanels>
						{senatorialCandidates && (
							<TabPanel>
								<h3 className='font-bold text-blue-500 mb-4'>
									Select your preferred Senatorial candidate
								</h3>

								<form onSubmit={handleSenatorialVoting}>
									<div className='flex flex-col space-y-4 mb-6'>
										{senatorialCandidates.map((candidate) => (
											<div
												key={candidate.id}
												className='flex items-center space-x-4'
											>
												<input
													type='radio'
													name='senator'
                          id={candidate.name}
                          value={candidate.name}
                          checked={senator === candidate.name}
                          onChange={e => setSenator(e.target.value)}
												/>
												<label
													htmlFor={candidate.name}
													className='font-bold text-lg cursor-pointer'
												>
													{candidate.name}{" "}
													<span className='text-red-600'>
														({candidate.party})
													</span>
												</label>
											</div>
										))}
									</div>

									<button
										type='submit'
										className='bg-blue-500 w-full text-white px-4 py-2 rounded'
									>
										Submit
									</button>
								</form>
							</TabPanel>
						)}

						{governorshipElection && (
							<TabPanel>
								<h3 className='font-bold text-blue-500 mb-4'>
									Select your preferred Governorship candidate
								</h3>

								<form onSubmit={handleGovernorshipVoting}>
									<div className='flex flex-col space-y-4 mb-6'>
										{governorshipElection?.candidates!.map((candidate) => (
											<div
												key={candidate.id}
												className='flex items-center space-x-4'
											>
												<input
													type='radio'
													name='governor'
                          id={candidate.name}
                          value={candidate.name}
                          checked={governor === candidate.name}
                          onChange={e => setGovernor(e.target.value)}
												/>
												<label
													htmlFor={candidate.name}
													className='font-bold text-lg cursor-pointer'
												>
													{candidate.name}{" "}
													<span className='text-red-600'>
														({candidate.party})
													</span>
												</label>
											</div>
										))}
									</div>

									<button
										type='submit'
										className='bg-blue-500 w-full text-white px-4 py-2 rounded'
									>
										Submit
									</button>
								</form>
							</TabPanel>
						)}
					</TabPanels>
				</Tabs>
			</div>
		</main>
	);
}
"use client";
import CandidateContent from "@/app/components/admin/CandidateContent";
import SideNav from "@/app/components/admin/SideNav";
import TopNav from "@/app/components/admin/TopNav";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";


export default function Home() {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(true);
	const [email, setEmail] = useState<string>("");
  const [parties, setParties] = useState<Party[]>([]);
  const [senators, setSenators] = useState<Candidate[]>([]);
  const [governors, setGovernors] = useState<Candidate[]>([]);

  async function fetchData<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint);

    if (!response.ok) {
        throw new Error(`Failed to fetch data from ${endpoint}`);
    }

    return response.json();
  }

  const fetchAllData = useCallback (async () => {
    try {
        const [candidates, party] = await Promise.all([
            fetchData<{senators: Candidate[], governors: Candidate[]}>('/api/candidates'),
            fetchData<Party[]>('/api/party')
        ]);
      
      const newParties: Party[] = [{ id: 500, name: "", logo: "", acronym: "" }, ...party];
      setParties(newParties);
      setSenators(candidates?.senators)
      setGovernors(candidates?.governors)
  
        // Log or process the data as needed
        console.log('Candidates:', candidates);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  }, []);

	useEffect(() => {
		fetchAllData();
	}, [fetchAllData]);

	const authenticateUser = useCallback(async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        return router.push("/admin/login");
      }
  const data = JSON.parse(token!);
  setEmail(data.user.email);
  setLoading(false)
}, [router]);

	useEffect(() => {
		authenticateUser();
	}, [authenticateUser]);

	return (
		<main className='flex min-h-screen flex-col w-full'>
			<TopNav email={email} />
			<div className='w-full min-h-[90vh] flex item-center'>
				<SideNav />

				<div className='p-4 lg:w-5/6 w-full '>
					{loading ? (
						<p>Authenticating, please wait....</p>
					) : (
              <CandidateContent parties={parties} governors={governors} senators={senators} />
					)}
				</div>
			</div>
		</main>
	);
}
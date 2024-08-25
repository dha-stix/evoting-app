"use client";
import DashboardContent from "@/app/components/admin/DashboardContent";
import SideNav from "@/app/components/admin/SideNav";
import TopNav from "@/app/components/admin/TopNav";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [numVoters, setNumVoters] = useState<number>(0);
  const [numParties, setNumParties] = useState<number>(0);
  const [numElections, setNumElections] = useState<number>(0);
  
  async function fetchData<T>(endpoint: string): Promise<T> {
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`Failed to fetch data from ${endpoint}`);
    }
    return response.json();
  }

  const fetchAllData = useCallback (async () => {
    try {
        const [{count: votersCount}, {count: partiesCount}, {count: electionsCount}] = await Promise.all([
          fetchData<{count: number}>('/api/voters/list'),
          fetchData<{count: number}>('/api/party'),
          fetchData<{count: number}>('/api/elections')
        ]);
      
      setNumVoters(votersCount);
      setNumParties(partiesCount);
      setNumElections(electionsCount)
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  }, []);

	useEffect(() => {
		fetchAllData();
	}, [fetchAllData]);

	const authenticateUser = useCallback(async () => {
		const token = sessionStorage.getItem("token");
		if (!token || token === undefined) {
			return router.push("/admin/login");
		}
		const data = JSON.parse(token!);
		setEmail(data.user.email);
		setLoading(false);
	}, [router]);

	useEffect(() => {
		authenticateUser();
  }, [authenticateUser]);
  


	if (loading) return <p>Authenticating, please wait....</p>;

	return (
		<main className='flex min-h-screen flex-col w-full'>
			<TopNav email={email} />
			<div className='w-full min-h-[90vh] flex item-center'>
				<SideNav />

				<div className='p-4 lg:w-5/6 w-full '>
          <DashboardContent numVoters={numVoters} numElections={numElections} numParties={numParties} />
				</div>
			</div>
		</main>
	);
}
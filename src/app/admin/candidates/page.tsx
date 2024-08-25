"use client";
import CandidateContent from "@/app/components/admin/CandidateContent";
import SideNav from "@/app/components/admin/SideNav";
import TopNav from "@/app/components/admin/TopNav";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase";

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
        const [candidates, {parties}] = await Promise.all([
            fetchData<{senators: Candidate[], governors: Candidate[]}>('/api/candidates'),
            fetchData<{parties: Party[]}>('/api/party')
        ]);
      
      const newParties: Party[] = [{ id: 500, name: "", logo: "", acronym: "" }, ...parties];
      setParties(newParties);
      setSenators(candidates?.senators)
      setGovernors(candidates?.governors)
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

  useEffect(() => {
    const insertChannelSub = supabase
      .channel("get-candidates")
      .on('postgres_changes', { event: "INSERT", schema: 'public', table: 'candidates' }, (payload) => {
        if (payload.new.election_type === "sen") {
          setSenators(prev => [...prev, payload.new] as Candidate[]);
        } else {
          setGovernors(prev => [...prev, payload.new] as Candidate[]);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(insertChannelSub);
    };
  }, []);


	return (
		<main className='flex min-h-screen flex-col w-full'>
			<TopNav email={email} />
			<div className='w-full min-h-[90vh] flex item-center'>
				<SideNav />

				<div className='p-4 lg:w-5/6 w-full '>
					{loading ? (
						<p>Authenticating, please wait....</p>
					) : (
              <CandidateContent parties={parties} governors={governors} senators={senators} setGovernors={setGovernors} setSenators={setSenators} />
					)}
				</div>
			</div>
		</main>
	);
}
"use client";
import VotersContent from "@/app/components/admin/VotersContent";
import SideNav from "@/app/components/admin/SideNav";
import TopNav from "@/app/components/admin/TopNav";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [voters, setVoters] = useState<Voter[]>([]);

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
  
  const fetchVoters = useCallback(async () => {
    const response = await fetch("/api/voters/list");
    if (!response.ok) {
      throw new Error("Failed to fetch voters");
    }
    const data = await response.json();
    setVoters(data.voters);
  }, []);
  
  useEffect(() => {
    fetchVoters();
  }, [fetchVoters]);

	return (
		<main className='flex min-h-screen flex-col w-full'>
			<TopNav email={email} />
			<div className='w-full min-h-[90vh] flex item-center'>
				<SideNav />

				<div className='p-4 lg:w-5/6 w-full '>
					{loading ? <p>Authenticating, please wait....</p> : <VotersContent voters={voters} setVoters={setVoters} />}
				</div>
			</div>
		</main>
	);
}
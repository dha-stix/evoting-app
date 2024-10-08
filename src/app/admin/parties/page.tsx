"use client";
import SideNav from "@/app/components/admin/SideNav";
import TopNav from "@/app/components/admin/TopNav";
import PartiesContent from "@/app/components/admin/PartiesContent";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(true);
	const [email, setEmail] = useState<string>("");
	const [parties, setParties] = useState<Party[]>([]);

    const fetchParties = useCallback(async () => {
        try {
            const response = await fetch('/api/party');
            const data = await response.json();
            setParties(data.parties);
        } catch (error) {
            console.error(error);
        }
    }, []);
    
    useEffect(() => {
        fetchParties();
	}, [fetchParties]);
	
	useEffect(() => {
		const insertChannelSub = supabase
			.channel("get-parties")
			.on('postgres_changes', { event: "INSERT", schema: 'public', table: 'parties' }, (payload) => {
				setParties(prev => [...prev, payload.new] as Party[])
			})
			.subscribe();
		return () => {
			supabase.removeChannel(insertChannelSub);
		};
	}, []);

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
						<PartiesContent parties={parties} />
					)}
				</div>
			</div>
		</main>
	);
}
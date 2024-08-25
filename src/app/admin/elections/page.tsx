"use client";
import ElectionContent from "@/app/components/admin/ElectionContent";
import SideNav from "@/app/components/admin/SideNav";
import TopNav from "@/app/components/admin/TopNav";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/utils/supabase";
import RecentElections from "@/app/components/admin/RecentElections";

export default function Home() {
	const [loading, setLoading] = useState<boolean>(true);
	const [email, setEmail] = useState<string>("");
	const [elections, setElections] = useState<Election[]>([]);
	const router = useRouter();

	const authenticateUser = useCallback(async () => {
		const token = sessionStorage.getItem("token");
		if (!token) {
			return router.push("/admin/login");
		}
		const data = JSON.parse(token!);
		setEmail(data.user.email);
		setLoading(false);
	}, [router]);

	useEffect(() => {
		authenticateUser();
	}, [authenticateUser]);

	const fetchElections = useCallback(async () => {
		const request = await fetch("/api/elections");
		const response = await request.json();
		setElections(response.data);
	}, []);

	useEffect(() => {
		fetchElections();
	}, [fetchElections]);

	useEffect(() => {
		const insertChannelSub = supabase
			.channel("get-elections")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "elections" },
				(payload) => {
					setElections((prev) => [...prev, payload.new] as Election[]);
				}
			)
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

				<div className='p-4 lg:w-5/6 w-full'>
					{loading ? (
						<p>Authenticating, please wait....</p>
					) : (
						<>
							<ElectionContent />

							<section className='w-full mt-8'>
								<h2 className='text-lg font-bold text-green-600'>
									Previous Elections
								</h2>
								{elections.length === 0 ? (
									<p className='text-sm'>No elections created yet.</p>
								) : (
									<RecentElections elections={elections} />
								)}
							</section>
						</>
					)}
				</div>
			</div>
		</main>
	);
}
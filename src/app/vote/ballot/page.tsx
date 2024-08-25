"use client"
import Ballot from "@/app/components/voter/Ballot";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [senatorialElection, setSenatorialElection] = useState<Election | null>(null);
  const [governorshipElection, setGovernorshipElection] = useState<Election | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userString = localStorage.getItem("_user_");
    if (!userString) {
      router.push("/");
      return;
    }
    const user = JSON.parse(userString);
    setUser(user);
  }, [router]);

  const fetchActiveElections = useCallback(async () => {
    const request = await fetch("/api/elections/active");
    const response = await request.json();
    if (response.count === 0 || !response.success) {
      alert("No active elections found");
      router.push("/");
      return;
    } 

    setSenatorialElection(response.sen);
    setGovernorshipElection(response.gov);
  }, [router]);

  useEffect(() => {
    fetchActiveElections();
   }, [fetchActiveElections]);
  
  return (
    <main className="flex min-h-screen flex-col w-full p-8">
      <h2 className='font-bold text-xl text-green-600'>Hello {user?.first_name}</h2>
      <p className="opacity-70 text-sm mb-4">You can cast your votes below:</p>
      <Ballot user={user} senatorialElection={senatorialElection} governorshipElection={governorshipElection} />
    </main>
  );
}

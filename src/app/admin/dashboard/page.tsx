"use client"
import DashboardContent from "@/app/components/admin/DashboardContent";
import SideNav from "@/app/components/admin/SideNav";
import TopNav from "@/app/components/admin/TopNav";
import { useCallback, useEffect, useState } from "react";
import Cryptr from "cryptr";
import { useRouter } from "next/navigation";
const cryptr = new Cryptr(process.env.NEXT_PUBLIC_SECRET!);

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true)
  const [email, setEmail] = useState<string>("");

const authenticateUser = useCallback(async () => {
      const token = sessionStorage.getItem("token");
      if (!token || token === undefined) {
        return router.push("/admin/login");
      }
  console.log(token)
      const data = JSON.parse(token!);
      setEmail(data.user.email);
      setLoading(false)
}, [router]);
  
  useEffect(() => {
   
    authenticateUser();
   }, [authenticateUser]);

  if (loading) return (<p>Authenticating, please wait....</p>)
  
  return (
    <main className="flex min-h-screen flex-col w-full">
      <TopNav email={email} />
      <div className="w-full min-h-[90vh] flex item-center">
        <SideNav />

        <div className="p-4 lg:w-5/6 w-full ">
           <DashboardContent />
        </div>
      </div>
    </main>
  );
}

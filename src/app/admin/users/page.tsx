"use client"
import SideNav from "@/app/components/admin/SideNav";
import TopNav from "@/app/components/admin/TopNav";
import DashboardContent from "@/app/components/admin/CandidateContent";
import { useCallback, useEffect, useState } from "react";
import Cryptr from "cryptr";
import { useRouter } from "next/navigation";
const cryptr = new Cryptr(process.env.NEXT_PUBLIC_SECRET!);

export default function Users() {
    const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true)
  const [email, setEmail] = useState<string>("");

const authenticateUser = useCallback(async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        return router.push("/admin/login");
      }
      const decryptedData = cryptr.decrypt(token);
      const data = JSON.parse(decryptedData);
      if(!data.session) {
        return router.push("/admin/login");
      }
  setEmail(data.user.email);
  setLoading(false)
}, [router]);
  
  useEffect(() => {
   
    authenticateUser();
   }, [authenticateUser]);


  return (
    <main className="flex min-h-screen flex-col w-full">
      <TopNav email={email} />
      <div className="w-full min-h-[90vh] flex item-center">
        <SideNav />

        <div className="p-4 lg:w-5/6 w-full ">
          {loading ? <p>Authenticating, please wait....</p> :  <p>Not yet available </p> }
        </div>
      </div>
    </main>
  );
}

"use client"
import CastVoteContent from "@/app/components/voter/CastVoteContent";
import SideNav from "@/app/components/voter/SideNav";
import TopNav from "@/app/components/voter/TopNav";

export default function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col w-full">
      <TopNav />
      <div className="w-full min-h-[90vh] flex item-center">
        <SideNav />

        <div className="p-4 lg:w-5/6 w-full ">
           <CastVoteContent />
        </div>
      </div>
    </main>
  );
}
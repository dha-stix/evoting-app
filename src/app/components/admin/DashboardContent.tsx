import { FaCaretUp } from "react-icons/fa6";
import image from "@/app/images/dashvote.jpeg"
import Image from "next/image";
import Link from "next/link";

interface Props { 
    numVoters: number;
    numParties: number;
    numElections: number
}

export default function DashboardContent({numVoters, numParties, numElections}: Props) {
    return (
        <div>
        <div className="w-full md:flex-row flex-col rounded-sm md:space-x-4 md:space-y-0 space-y-4 flex items-center justify-between mb-6">
            <div className="md:w-1/3 w-full bg-red-100 rounded-md shadow py-8 flex flex-col justify-center px-4">
                <span className="flex items-center mb-3">
                    <p className="text-sm ">Registered Voters</p>
                    <FaCaretUp className="text-red-500"/>
                </span>
                
                <h2 className="font-bold text-3xl">{numVoters}</h2>
            </div>
            <div className="md:w-1/3 w-full bg-green-100 rounded-md shadow py-8 flex flex-col justify-center px-4">
                   <span className="flex items-center mb-3">
                    <p className="text-sm ">Political Parties</p>
                    <FaCaretUp className="text-green-500"/>
                </span>
                
                <h2 className="font-bold text-3xl">{numParties}</h2>
            </div>

            <div className="md:w-1/3 w-full bg-blue-100 rounded-md shadow py-8 flex flex-col justify-center px-4">
                   <span className="flex items-center mb-3">
                    <p className="text-sm ">Elections Held</p>
                    <FaCaretUp className="text-blue-500"/>
                </span>
                
                <h2 className="font-bold text-3xl">{numElections}</h2>
            </div>
            </div>
            <section className="w-full bg-gray-50 shadow rounded-sm flex md:flex-row flex-col items-center justify-between p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-green-700 mb-2">Start an Election</h2>
                    <Link href="/admin/elections" className="bg-green-500 text-white px-4 py-3 text-sm rounded-md md:mb-0 mb-4 block">Create Election</Link>
                </div>
               
                <div> <Image src={image} alt="dashboard" className="rounded-md"/></div>
            </section>
        </div>
        
    )
}
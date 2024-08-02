import { MdDashboard, MdHowToVote, MdGroups } from "react-icons/md";
import { FaPersonDrowning } from "react-icons/fa6";
import { PiArrowsCounterClockwiseBold } from "react-icons/pi";
import { Link } from "@chakra-ui/next-js";

export default function SideNav() {
    return (
           <div className="p-4 lg:w-1/6 border-r-2 border-r-gray-100 space-y-8 lg:inline-block hidden">
          <Link href="/admin/dashboard" className="flex items-center space-x-2 hover:font-bold">
            <MdDashboard className="text-green-700 text-lg" />
            <p className="text-sm">Dashboard</p>
          </Link>

           <Link href="/admin/elections" className="flex items-center space-x-2 hover:font-bold">
            <MdGroups className="text-green-700 text-lg" />
            <p  className="text-sm">Elections</p>
          </Link>

           <Link href="/admin/candidates" className="flex items-center space-x-2 hover:font-bold">
            <FaPersonDrowning className="text-green-700 text-lg" />
            <p  className="text-sm">Candidates</p>
          </Link>

          <Link href="/admin/voters" className="flex items-center space-x-2 hover:font-bold">
            <MdHowToVote className="text-green-700 text-lg" />
            <p  className="text-sm">Voters</p>
          </Link>

           <Link href="/admin/parties" className="flex items-center space-x-2 hover:font-bold">
            <MdGroups className="text-green-700 text-lg" />
            <p  className="text-sm">Political Parties</p>
          </Link>

         <Link href="/admin/users" className="flex items-center space-x-2 hover:font-bold">
             <FaPersonDrowning className="text-green-700 text-lg" />
          <p className="text-sm">Admin Users</p>
        </Link>
        
           <Link href="/vote/count" className="flex items-center space-x-2 hover:font-bold">
            <PiArrowsCounterClockwiseBold className="text-green-700 text-lg" />
            <p  className="text-sm">Vote Count</p>
        </Link>
        </div>
    )
}
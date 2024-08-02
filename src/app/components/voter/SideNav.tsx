import { MdDashboard, MdHowToVote } from "react-icons/md";
import { PiArrowsCounterClockwiseBold } from "react-icons/pi";
import { Link } from "@chakra-ui/next-js";

export default function SideNav() {
    return (
           <div className="p-4 lg:w-1/6 border-r-2 border-r-gray-100 space-y-8 lg:inline-block hidden">
          <Link href="/vote/dashboard" className="flex items-center space-x-2 hover:font-bold">
            <MdDashboard className="text-green-700 text-lg" />
            <p className="text-sm">Dashboard</p>
          </Link>

          <Link href="/vote/cast" className="flex items-center space-x-2 hover:font-bold">
            <MdHowToVote className="text-green-700 text-lg" />
            <p  className="text-sm">Cast Vote</p>
          </Link>


           <Link href="/vote/count" className="flex items-center space-x-2 hover:font-bold">
            <PiArrowsCounterClockwiseBold className="text-green-700 text-lg" />
            <p  className="text-sm">Vote Count</p>
          </Link>
        </div>
    )
}
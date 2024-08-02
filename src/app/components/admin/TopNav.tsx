import {
	Menu,
	MenuButton,
	MenuList,
	MenuItem,
	Button,
} from "@chakra-ui/react";
import { supabase } from "@/app/utils/supabase";
import { useRouter } from "next/navigation";

export default function TopNav({ email }: { email: string }) {
	const router = useRouter();

	const handleLogout = async () => { 
		const { error } = await supabase.auth.signOut()
		if (error) return console.log(error.message);
		sessionStorage.removeItem("token");
		router.push("/admin/login");
	}

	return (
		<nav className='w-full px-4 py-2 border-b-2 border-b-gray-100 flex items-center justify-between'>
			<h2 className='font-bold text-xl '>AuthVote </h2>

			<div className='flex items-center space-x-4'>
				<p className='text-xs'>{email}</p>

				<Menu>
					<MenuButton as={Button} size='sm' colorScheme='red'>
						Log Out
					</MenuButton>
					<MenuList className='text-sm'>
						<MenuItem onClick={() => handleLogout()}>Log Out</MenuItem>
						<MenuItem onClick={() => router.push("/admin/candidates")}>Candidates</MenuItem>
						<MenuItem onClick={() => router.push("/admin/voters")}>Voters</MenuItem>
						<MenuItem onClick={() => router.push("/admin/parties")}>Political Parties</MenuItem>
						<MenuItem onClick={() => router.push("/admin/dashboard")}>Dashboard</MenuItem>
					</MenuList>
				</Menu>
			</div>
		</nav>
	);
}
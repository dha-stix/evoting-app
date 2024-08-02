import {
	Menu,
	MenuButton,
	MenuList,
	Avatar,
	MenuItem,
	Button,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";

export default function TopNav() {
	const router = useRouter();

	return (
		<nav className='w-full px-4 py-2 border-b-2 border-b-gray-100 flex items-center justify-between'>
			<h2 className='font-bold text-xl '>AuthVote </h2>

			<div className='flex items-center space-x-4'>
				<p className='text-xs'>Admin</p>
				<Avatar name='Dan Abrahmov' src='https://bit.ly/dan-abramov' />

				<Menu>
					<MenuButton as={Button} size='sm' colorScheme='red'>
						Log Out
					</MenuButton>
					<MenuList className='text-sm'>
						<MenuItem onClick={() => router.replace("/")}>Log Out</MenuItem>
						<MenuItem onClick={() => router.push("/vote/dashboard")}>Dashboard</MenuItem>
						<MenuItem onClick={() => router.push("/vote/cast")}>Cast Votes</MenuItem>
						<MenuItem onClick={() => router.push("/vote/count")}>Vote Count</MenuItem>
					</MenuList>
				</Menu>
			</div>
		</nav>
	);
}
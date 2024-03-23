import Link from "next/link";

export default function Home() {
	return (
		<main className='p-8 flex items-center justify-center min-h-screen flex-col w-full'>
			<Link
				href='/vote/register'
				className='px-6 rounded font-lg mb-6 py-4 bg-green-700 text-[#FBF6EE]'
			>
				Voters&apos; Registration
			</Link>
			<Link
				href='/admin/login'
				className='px-6 rounded mb-4 py-4 font-lg bg-green-500 text-[#FBF6EE]'
			>
				Admin Login
      </Link>
      
      <Link
				href='/vote/login'
				className='px-6 rounded font-lg mb-6 py-4 bg-green-700 text-[#FBF6EE]'
			>
				Voters&apos; Election Page
			</Link>
		</main>
	);
}
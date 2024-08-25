import Link from "next/link";
import vote from "@/app/images/vote.jpg";
import Image from "next/image";

export default function Home() {
	return (
		<main className='flex min-h-screen flex-col w-full'>
			<nav className=' px-4 py-2 h-[10vh] border-b-[1px] flex items-center justify-between'>
				<h2 className='font-extrabold text-xl'>AuthVote</h2>
				<Link
					href='/admin/login'
					className='px-4 rounded  py-2 font-lg bg-green-500 text-[#FBF6EE]'
				>
					Admin Login
				</Link>
			</nav>

			<section className='h-[90vh] px-4 w-full flex items-center justify-between space-x-5'>
				<div className='md:w-2/3 w-full h-full md:px-6 flex flex-col justify-center'>
					<h2 className='font-extrabold md:text-4xl text-2xl text-green-500 mb-2'>
						E-voting System
					</h2>
					<p className='text-gray-500 md:text-lg text-sm mb-5'>
						Our e-voting platform revolutionizes the way you participate in
						elections. Designed with security, transparency, and ease of use in
						mind, our system ensures that every vote counts and is accurately
						recorded.
					</p>

					<section className='w-full flex items-center space-x-3'>
						<Link
							href='/vote/register'
							className='md:px-4 px-2 md:text-md text-sm block rounded mb-6 py-4 hover:bg-white hover:text-black hover:border-[1px] bg-green-700 text-[#FBF6EE]'
						>
							Voters&apos; Registration
						</Link>

						<Link
							href='/vote/login'
							className='md:px-4 px-2 md:text-md text-sm rounded mb-6 py-4 hover:border-none hover:bg-green-700 hover:text-green-50 border-[1px] border-green-700 bg-white'
						>
							Voters&apos; Election Login
						</Link>
						<Link
							href='/vote/card'
							className='md:px-4 px-2 md:text-md text-sm block rounded mb-6 py-4 hover:bg-white hover:text-black hover:border-[1px] bg-green-700 text-[#FBF6EE]'
						>
							Print Voter&apos;s Card
						</Link>
					</section>
				</div>

				<div className='md:w-1/3 hidden h-full md:flex items-center justify-center'>
					<Image src={vote} alt='E-voting System' />
				</div>
			</section>
		</main>
	);
}

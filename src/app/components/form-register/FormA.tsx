export default function FormA({
	register,
	errors,
	states,
	selectedState,
	setSelectedState,
	lgas,
}: {
	register: any;
	errors: any;
	states: string[];
	selectedState: string;
	setSelectedState: any;
	lgas: string[];
}) {
	return (
		<>
			<div className='w-full flex md:flex-row flex-col items-center space-y-4 md:space-y-0 md:space-x-4 space-x-0'>
				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor='first_name'>
						First Name
					</label>
					<input
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
						type='text'
						{...register("first_name")}
						id='first_name'
					/>
					<p className='text-red-500 text-xs'>{errors.first_name?.message}</p>
				</div>

				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor='last_name'>
						Last Name
					</label>
					<input
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
						type='text'
						{...register("last_name")}
						id='last_name'
					/>
					<p className='text-red-500 text-xs'>{errors.last_name?.message}</p>
				</div>
			</div>

			<div className='w-full flex md:flex-row flex-col items-center space-y-4 md:space-y-0 md:space-x-4 space-x-0'>
				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor='middle_name'>
						Middle Name
					</label>
					<input
						type='text'
						{...register("middle_name")}
						id='middle_name'
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
					/>
					<p className='text-red-500 text-xs'>{errors.middle_name?.message}</p>
				</div>
				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor='date_of_birth'>
						Date of Birth
					</label>
					<input
						type='date'
						id='date_of_birth'
						{...register("date_of_birth")}
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
					/>
					<p className='text-red-500 text-xs'>
						{errors.date_of_birth?.message}
					</p>
				</div>
			</div>

			<div className='w-full flex md:flex-row flex-col items-center space-y-4 md:space-y-0 md:space-x-4 space-x-0'>
				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor='email_address'>
						Email Address
					</label>
					<input
						type='email'
						id='email_address'
						{...register("email_address")}
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
					/>
					<p className='text-red-500 text-xs'>
						{errors.email_address?.message}
					</p>
				</div>

				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor='nin'>
						National Identification Number (NIN)
					</label>
					<input
						id='nin'
						type='text'
						{...register("nin")}
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
					/>
					<p className='text-red-500 text-xs'>{errors.nin?.message}</p>
				</div>
			</div>

			<div className='w-full flex md:flex-row flex-col items-center space-y-4 md:space-y-0 md:space-x-4 space-x-0'>
				<div className='md:w-1/2 w-full'>
					<label className='tex3t-sm' htmlFor='occupation'>
						Occupation
					</label>
					<input
						type='text'
						id='occupation'
						{...register("occupation")}
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
					/>
					<p className='text-red-500 text-xs'>{errors.occupation?.message}</p>
				</div>

				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor='phone'>
						Mobile Number
					</label>
					<input
						id='phone'
						type='text'
						{...register("phone_number")}
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
					/>
					<p className='text-red-500 text-xs'>{errors.phone_number?.message}</p>
				</div>
			</div>

			<div className='w-full flex md:flex-row flex-col items-center space-y-4 md:space-y-0 md:space-x-4 space-x-0'>
				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor="'origin_state'">
						State of Origin
					</label>
					<select
						id='state_of_origin'
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
						{...register("state_of_origin")}
						value={selectedState}
						onChange={(e) => setSelectedState(e.target.value)}
					>
						{states.map((state) => (
							<option key={state} value={state}>
								{state}
							</option>
						))}
					</select>
					<p className='text-red-500 text-xs'>
						{errors.state_of_origin?.message}
					</p>
				</div>

				<div className='md:w-1/2 w-full'>
					<label className='text-sm' htmlFor='lga_of_origin'>
						LGA of Origin
					</label>
					<select
						id='lga_of_origin'
						{...register("lga_of_origin")}
						className=' text-sm w-full py-2 px-2 rounded-sm border-[1px] border-gray-300'
					>
						{lgas.map((lga) => (
							<option key={lga} value={lga}>
								{lga}
							</option>
						))}
					</select>
					<p className='text-red-500 text-xs'>
						{errors.lga_of_origin?.message}
					</p>
				</div>
			</div>
		</>
	);
}
import * as z from "zod";

export const ondo_lgas: LGA[] = [
	{ id: "select", name: "Select" },
	{
		id: "akoko_north_east",
		name: "Akoko North-East",
		location: "north",
	},
	{
		id: "akoko_north_west",
		name: "Akoko North-West",
		location: "north",
	},
	{
		id: "akoko_south_east",
		name: "Akoko South-East",
		location: "north",
	},
	{
		id: "akoko_south_west",
		name: "Akoko South-West",
		location: "north",
	},
	{
		id: "akure_north",
		name: "Akure North",
		location: "central",
	},
	{
		id: "akure_south",
		name: "Akure South",
		location: "central",
	},
	{
		id: "ese_odo",
		name: "Ese Odo",
		location: "south",
	},
	{
		id: "idanre",
		name: "Idanre",
		location: "central",
	},
	{
		id: "ifedore",
		name: "Ifedore",
		location: "central",
	},
	{
		id: "ilaje",
		name: "Ilaje",
		location: "south",
	},
	{
		id: "ile_oluji_okeigbo",
		name: "Ile Oluji/Okeigbo",
		location: "central",
	},
	{
		id: "irele",
		name: "Irele",
		location: "south",		
	},
	{
		id: "odigbo",
		name: "Odigbo",
		location: "south",
	},
	{
		id: "okitipupa",
		name: "Okitipupa",
		location: "south",
	},
	{
		id: "ondo_east",
		name: "Ondo East",
		location: "central",
	},
	{
		id: "ondo_west",
		name: "Ondo West",
		location: "central",
	},
	{
		id: "ose",
		name: "Ose",
		location: "north",
	},
	{
		id: "owo",
		name: "Owo",
		location: "north",
	},
];

export const schema = z.object({
	first_name: z
		.string({
			message: "First name is required",
		})
		.min(2, { message: "Invalid length" }),
	last_name: z
		.string({
			message: "Last name is required",
		})
		.min(2, { message: "Invalid length" }),
	middle_name: z
		.string({
			message: "Middle name is required",
		})
		.min(2, { message: "Invalid length" }),
	date_of_birth: z
		.string({
			message: "Invalid date of birth",
		})
		.refine(
			(value) => {
				const today = new Date();
				const dob = new Date(value);
				const age = today.getFullYear() - dob.getFullYear();
				const monthDiff = today.getMonth() - dob.getMonth();
				if (
					monthDiff < 0 ||
					(monthDiff === 0 && today.getDate() < dob.getDate())
				) {
					return age > 18;
				}
				return age >= 18;
			},
			{ message: "You must be at least 18 years old" }
		),
	email_address: z
		.string({
			message: "Email address is required",
		})
		.email({ message: "Invalid email address" }),
	occupation: z
		.string({
			message: "Occupation is required",
		})
		.min(2, { message: "Invalid length" }),
	phone_number: z
		.string({ message: "Phone number is required" })
		.regex(/^\d{11}$/, {
			message:
				"Phone number must be exactly 11 digits long and contain only digits",
		}),

	nin: z
		.string()
		.min(11, { message: "Invalid NIN" })
		.regex(/^\d{11}$/, {
			message:
				"Phone number must be exactly 11 digits long and contain only digits",
		}),
	lga_of_origin: z
		.string({
			message: "LGA of origin is required",
		})
		.min(2, { message: "Pick your LGA" }),
	state_of_origin: z
		.string({
			message: "State of origin is required",
		})
		.min(2, { message: "Pick your state" }),
	residential_address: z
		.string({
			message: "Residential address is required",
		})
		.min(2, { message: "Invalid length" }),
	state_of_residence: z
		.string({
			message: "State of residence is required",
		})
		.min(2, { message: "Pick your state" }),
	lga_of_residence: z
		.string({
			message: "LGA of residence is required",
		})
		.min(2, { message: "Pick your LGA" }),
	gender: z.string({
		message: "Gender is required"
	}),
});

export const printCardSchema = z.object({
	vin: z
		.string({
			message: "Voter Identification Number is required",
		})
		.min(12, { message: "Invalid VIN" }),
});

export const adminFormSchema = z.object({
	email: z
		.string({
			message: "Email address is required",
		})
		.email({ message: "Invalid email address" }),
	password: z
		.string({
			message: "Password is required",
		})
		.min(6, { message: "Password must be at least 6 characters long" }),
});

export const votersFormSchema = z.object({
	email: z
		.string({
			message: "Email address is required",
		})
		.email({ message: "Invalid email address" }),
	date_of_birth: z
		.string({
			message: "Invalid date of birth",
		})
		.refine(
			(value) => {
				const today = new Date();
				const dob = new Date(value);
				const age = today.getFullYear() - dob.getFullYear();
				const monthDiff = today.getMonth() - dob.getMonth();
				if (
					monthDiff < 0 ||
					(monthDiff === 0 && today.getDate() < dob.getDate())
				) {
					return age > 18;
				}
				return age >= 18;
			},
			{ message: "You must be at least 18 years old" }
	),
	nin: z
		.string()
		.min(11, { message: "Invalid NIN" })
		.regex(/^\d{11}$/, {
			message:
				"Phone number must be exactly 11 digits long and contain only digits",
		}),
	vin: z
		.string({
			message: "Voter Identification Number is required",
		})
		.min(12, { message: "Invalid VIN" }),
});

export const calculateAge = (dob: string | undefined): string => {
	if(!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    const dayDifference = today.getDate() - birthDate.getDate();

    // Adjust age if birth date has not occurred yet this year
    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
        age--;
    }

    return `${age}yrs`;
}

export const ondoSenatorialDistricts: District[] = [
	{
		id: "",
		name: "Select",
	},
	{
		id: "north",
		name: "Ondo North",
	},
	{
		id: "central",
		name: "Ondo Central",
	},
	{
		id: "south",
		name: "Ondo South",
	},

]

export const electionTypes: Election[] = [
	{
		id: 1,
		name: "Senatorial Election",
		type: "sen",
		status: "Not Started",
		active: false,
		description: "This is the description for the senatorial election",
	},
	{
		id: 2,
		name: "Governorship Election",
		type: "gov",
		status: "Not Started",
		active: false,
		description: "This is the description for the governorship election",
	},
]

export const capitalize = (word: string | null) => {
	if (!word) return "";
	const result = word[0].toUpperCase() + word.slice(1);
	return ` (Ondo ${result}) `;
}

export const determineLGA = (lga: string): string => { 
	const lgas = ondo_lgas.filter((l) => l.name === lga);
	if (lgas.length === 0 || !lgas[0].location) return "";
	return lgas[0].location;
}

export const  formatDate = (dateString: string) : string => {
  const date = new Date(dateString);

  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';

  hours = hours % 12 || 12; // Convert to 12-hour format

  const daySuffix = ['th', 'st', 'nd', 'rd'];
  const relevantSuffix = daySuffix[(day % 10 > 3 || Math.floor((day % 100) / 10) === 1) ? 0 : day % 10];

  return `${day}${relevantSuffix} ${month}, ${year} at ${hours}:${minutes}${ampm}`;
}

export const getWinner = (electionDataString: string): string | null => {
  // Parse the JSON string
  const electionData: Result[] = JSON.parse(electionDataString);

  // Return null if the array is empty
  if (electionData.length === 0) {
    return null;
  }

  // Find the object with the highest vote count
  const winner = electionData.reduce((max, candidate) =>
    candidate.vote_count > max.vote_count ? candidate : max
  );

  // Return the name of the candidate with the highest vote count
  return `${winner.name} (${winner.party})`;
}
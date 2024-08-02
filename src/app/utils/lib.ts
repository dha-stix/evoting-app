import * as z from "zod";

export const ondo_lgas: LGA[] = [
	{ id: "select", name: "Select" },
	{
		id: "akoko_north_east",
		name: "Akoko North-East",
	},
	{
		id: "akoko_north_west",
		name: "Akoko North-West",
	},
	{
		id: "akoko_south_east",
		name: "Akoko South-East",
	},
	{
		id: "akoko_south_west",
		name: "Akoko South-West",
	},
	{
		id: "akure_north",
		name: "Akure North",
	},
	{
		id: "akure_south",
		name: "Akure South",
	},
	{
		id: "ese_odo",
		name: "Ese Odo",
	},
	{
		id: "idanre",
		name: "Idanre",
	},
	{
		id: "ifedore",
		name: "Ifedore",
	},
	{
		id: "ilaje",
		name: "Ilaje",
	},
	{
		id: "ile_oluji_okeigbo",
		name: "Ile Oluji/Okeigbo",
	},
	{
		id: "irele",
		name: "Irele",
	},
	{
		id: "odigbo",
		name: "Odigbo",
	},
	{
		id: "okitipupa",
		name: "Okitipupa",
	},
	{
		id: "ondo_east",
		name: "Ondo East",
	},
	{
		id: "ondo_west",
		name: "Ondo West",
	},
	{
		id: "ose",
		name: "Ose",
	},
	{
		id: "owo",
		name: "Owo",
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


import { z } from "zod";
import { ELECTION_STATE, LGA_DISTRICT, STATES_LGAS } from "./constants";

const name = (label: string) =>
	z
		.string()
		.trim()
		.min(2, `${label} is too short`)
		.max(60, `${label} is too long`)
		.regex(/^[\p{L}' -]+$/u, `${label} can only contain letters`);

export const isAdult = (value: string) => {
	const dob = new Date(value);
	if (Number.isNaN(dob.getTime())) return false;
	const today = new Date();
	const eighteen = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
	return eighteen <= today && dob.getFullYear() > 1900;
};

const dob = z.string().refine(isAdult, "You must be at least 18 years old");
export const nin = z.string().trim().regex(/^\d{11}$/, "NIN must be exactly 11 digits");
export const vin = z
	.string()
	.trim()
	.toUpperCase()
	.transform((v) => v.replace(/[^A-Z0-9]/g, ""))
	.refine((v) => v.length === 12, "VIN has 12 letters and numbers")
	.transform((v) => `${v.slice(0, 4)}-${v.slice(4, 8)}-${v.slice(8)}`);

export const personalSchema = z.object({
	first_name: name("First name"),
	middle_name: z.union([name("Middle name"), z.literal("")]).optional(),
	last_name: name("Last name"),
	date_of_birth: dob,
	gender: z.enum(["female", "male"], { message: "Choose a gender" }),
	email: z.string().trim().toLowerCase().email("Enter a valid email address"),
	phone: z
		.string()
		.trim()
		.transform((v) => v.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, ""))
		.refine((v) => /^[789]\d{9}$/.test(v), "Enter a valid Nigerian mobile number"),
	nin,
	occupation: z.string().trim().min(2, "Occupation is required").max(60),
});

export const locationSchema = z
	.object({
		origin_state: z.string().refine((s) => s in STATES_LGAS, "Choose your state of origin"),
		origin_lga: z.string().min(2, "Choose your LGA of origin"),
		home_address: z.string().trim().min(5, "Enter your full address").max(200),
		home_state: z.literal(ELECTION_STATE, { message: `Voters must live in ${ELECTION_STATE} State` }),
		home_lga: z.string().refine((l) => l in LGA_DISTRICT, "Choose your LGA of residence"),
	})
	.refine((v) => STATES_LGAS[v.origin_state]?.includes(v.origin_lga), {
		message: "That LGA is not in your state of origin",
		path: ["origin_lga"],
	});

export const registrationSchema = personalSchema.and(locationSchema).and(
	z.object({ consent: z.literal(true, { message: "Please confirm your consent" }) }),
);

export type PersonalInput = z.input<typeof personalSchema>;
export type LocationInput = z.input<typeof locationSchema>;
export type RegistrationInput = z.input<typeof registrationSchema>;

export const voterLookupSchema = z.object({ vin, nin, date_of_birth: dob });
export const cardLookupSchema = z.object({ vin, date_of_birth: z.string().min(8, "Enter your date of birth") });
export const otpSchema = z.object({ code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") });

export const adminLoginSchema = z.object({
	email: z.string().trim().toLowerCase().email("Enter a valid email"),
	password: z.string().min(8, "Password is at least 8 characters"),
});

export const partySchema = z.object({
	name: z.string().trim().min(3, "Enter the party name").max(80),
	acronym: z
		.string()
		.trim()
		.toUpperCase()
		.regex(/^[A-Z0-9]{1,8}$/, "Use up to 8 letters or numbers"),
	color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Pick a colour"),
});

export const candidateSchema = z
	.object({
		full_name: z.string().trim().min(3, "Enter the candidate's full name").max(120),
		party_id: z.coerce.number().int().positive("Choose a party"),
		type: z.enum(["governorship", "senatorial"]),
		district: z.enum(["north", "central", "south"]).nullable(),
		running_mate: z.string().trim().max(120).optional().or(z.literal("")),
	})
	.refine((v) => (v.type === "senatorial") === Boolean(v.district), {
		message: "Senatorial candidates need a district",
		path: ["district"],
	});

export const electionSchema = z
	.object({
		title: z.string().trim().min(3, "Enter a title").max(140),
		type: z.enum(["governorship", "senatorial"]),
		district: z.enum(["north", "central", "south"]).nullable(),
		description: z.string().trim().max(500).optional().or(z.literal("")),
		starts_at: z.string().min(1, "Choose when voting opens"),
		ends_at: z.string().min(1, "Choose when voting closes"),
		candidate_ids: z.array(z.number().int()).min(2, "Pick at least two candidates"),
		is_draft: z.boolean(),
	})
	.refine((v) => (v.type === "senatorial") === Boolean(v.district), {
		message: "Senatorial elections need a district",
		path: ["district"],
	})
	.refine((v) => new Date(v.ends_at) > new Date(v.starts_at), {
		message: "Closing time must be after opening time",
		path: ["ends_at"],
	});

export const inviteSchema = z.object({
	full_name: z.string().trim().min(3, "Enter their name").max(80),
	email: z.string().trim().toLowerCase().email("Enter a valid email"),
	role: z.enum(["super_admin", "officer", "observer"]),
});

export type ElectionInput = z.infer<typeof electionSchema>;
export type CandidateInput = z.input<typeof candidateSchema>;

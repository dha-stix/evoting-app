import type { District } from "@/types";

/**
 * Ondo State's 18 local government areas, grouped by senatorial district.
 * Kept in step with the `lgas` table (supabase/migrations/20261101000000_ondo_lgas.sql).
 * A voter can only vote in the senatorial election for the district their LGA
 * of residence belongs to.
 */
export interface Lga {
	name: string;
	headquarters: string;
	district: District;
}

export const ONDO_LGAS: Lga[] = [
	// Ondo North
	{ name: "Akoko North-East", headquarters: "Ikare-Akoko", district: "north" },
	{ name: "Akoko North-West", headquarters: "Oke-Agbe", district: "north" },
	{ name: "Akoko South-East", headquarters: "Isua", district: "north" },
	{ name: "Akoko South-West", headquarters: "Oka", district: "north" },
	{ name: "Ose", headquarters: "Ifon", district: "north" },
	{ name: "Owo", headquarters: "Owo", district: "north" },
	// Ondo Central
	{ name: "Akure North", headquarters: "Iju/Itaogbolu", district: "central" },
	{ name: "Akure South", headquarters: "Akure", district: "central" },
	{ name: "Idanre", headquarters: "Owena", district: "central" },
	{ name: "Ifedore", headquarters: "Igbara-Oke", district: "central" },
	{ name: "Ondo East", headquarters: "Bolorunduro", district: "central" },
	{ name: "Ondo West", headquarters: "Ondo", district: "central" },
	// Ondo South
	{ name: "Ese Odo", headquarters: "Igbekebo", district: "south" },
	{ name: "Ilaje", headquarters: "Igbokoda", district: "south" },
	{ name: "Ile Oluji/Okeigbo", headquarters: "Ile-Oluji", district: "south" },
	{ name: "Irele", headquarters: "Ode-Irele", district: "south" },
	{ name: "Odigbo", headquarters: "Ore", district: "south" },
	{ name: "Okitipupa", headquarters: "Okitipupa", district: "south" },
];

export const DISTRICT_ORDER: District[] = ["north", "central", "south"];

export const LGAS_BY_DISTRICT: Record<District, Lga[]> = {
	north: ONDO_LGAS.filter((l) => l.district === "north"),
	central: ONDO_LGAS.filter((l) => l.district === "central"),
	south: ONDO_LGAS.filter((l) => l.district === "south"),
};

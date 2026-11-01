import type { Metadata } from "next";
import { RegisterFlow } from "@/components/register/RegisterFlow";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Register to vote", path: "/register", image: "register", description: "Register once with your NIN and a guided live face scan. Your Voter ID Number arrives by email, ready for election day in Ondo State." });

export default function RegisterPage() {
	return <RegisterFlow />;
}

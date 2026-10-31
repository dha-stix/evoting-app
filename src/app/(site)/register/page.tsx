import type { Metadata } from "next";
import { RegisterFlow } from "@/components/register/RegisterFlow";

export const metadata: Metadata = { title: "Register to vote" };

export default function RegisterPage() {
	return <RegisterFlow />;
}

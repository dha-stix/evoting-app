import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, createSessionClient, getCurrentAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const csvCell = (v: unknown) => {
	const s = String(v ?? "");
	// Quote everything and neutralise spreadsheet formulas.
	return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export async function GET(request: NextRequest) {
	const admin = await getCurrentAdmin();
	if (!admin) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

	const params = request.nextUrl.searchParams;
	let query = createSessionClient()
		.from("voters")
		.select("vin, first_name, middle_name, last_name, gender, home_lga, district, status, created_at")
		.order("created_at", { ascending: false })
		.limit(50_000);
	const lga = params.get("lga");
	const status = params.get("status");
	if (lga) query = query.eq("home_lga", lga);
	if (status === "active" || status === "suspended") query = query.eq("status", status);

	const { data, error } = await query;
	if (error) return NextResponse.json({ error: "export failed" }, { status: 500 });

	await createServiceClient().from("audit_log").insert({ actor_id: admin.id, actor_email: admin.email, action: "voters.exported", entity: "voter", details: { rows: data.length, lga, status } });

	const header = ["VIN", "First name", "Middle name", "Last name", "Gender", "LGA", "District", "Status", "Registered"];
	const lines = data.map((v) => [v.vin, v.first_name, v.middle_name, v.last_name, v.gender, v.home_lga, v.district, v.status, v.created_at].map(csvCell).join(","));
	return new NextResponse([header.map(csvCell).join(","), ...lines].join("\n"), {
		headers: {
			"content-type": "text/csv; charset=utf-8",
			"content-disposition": `attachment; filename="authvote-voters-${new Date().toISOString().slice(0, 10)}.csv"`,
			"cache-control": "no-store",
		},
	});
}

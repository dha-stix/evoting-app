// Makes an existing or new account a super admin.
//   npm run create-admin -- you@example.com "Your Name"
// Then open /admin/login → "Forgot password?" to set the password yourself.
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.

import { createClient } from "@supabase/supabase-js";

const [email, ...nameParts] = process.argv.slice(2);
const fullName = nameParts.join(" ").trim();
if (!email || !fullName) {
	console.error('Usage: npm run create-admin -- you@example.com "Your Name"');
	process.exit(1);
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const address = email.trim().toLowerCase();

const { data: list, error: listError } = await db.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw listError;
let user = list.users.find((u) => u.email?.toLowerCase() === address);
if (!user) {
	// No password is set here: the owner chooses it through the reset link.
	const { data, error } = await db.auth.admin.createUser({ email: address, email_confirm: true });
	if (error) throw error;
	user = data.user;
}

const { error } = await db.from("admins").upsert({ id: user.id, email: address, full_name: fullName, role: "super_admin" });
if (error) throw error;
console.log(`${address} is a super admin. Go to /admin/login → "Forgot password?" to set the password.`);

import "server-only";
import { Resend } from "resend";
import { CREDIT, SITE_NAME } from "./constants";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = () => process.env.EMAIL_FROM ?? `${SITE_NAME} <onboarding@resend.dev>`;

function layout(title: string, body: string) {
	return `<!doctype html><html><body style="margin:0;background:#F5F7F2;font-family:Arial,Helvetica,sans-serif;color:#0D1B14">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;border:1px solid #E2E8E1">
<tr><td style="padding:28px 28px 8px"><span style="display:inline-block;background:#0A6B3D;color:#fff;font-weight:700;padding:6px 10px;border-radius:8px">${SITE_NAME}</span></td></tr>
<tr><td style="padding:8px 28px 28px"><h1 style="font-size:22px;margin:12px 0">${title}</h1>${body}</td></tr>
</table>
<p style="font-size:12px;color:#5B6B62;margin-top:16px">Built by <a href="${CREDIT.url}" style="color:#0A6B3D">${CREDIT.name}</a></p>
</td></tr></table></body></html>`;
}

/** Reserved domain for the demo accounts created by scripts/seed-demo.mjs. */
const DEMO_DOMAIN = "@demo.authvote.local";

async function send(to: string, subject: string, html: string) {
	if (!resend || to.endsWith(DEMO_DOMAIN)) {
		// Local development without Resend: print instead of failing.
		console.info(`[email] to=${to} subject="${subject}"\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")}`);
		return;
	}
	const { error } = await resend.emails.send({ from: from(), to, subject, html });
	if (error) throw new Error(`Email failed: ${error.message}`);
}

export const sendVinEmail = (to: string, firstName: string, vin: string) =>
	send(
		to,
		`Your ${SITE_NAME} Voter ID Number`,
		layout(
			`Welcome, ${firstName}`,
			`<p style="line-height:1.6;color:#44544B">You are registered to vote. Keep this number private. You will need it, your NIN and your date of birth to sign in.</p>
<p style="font-family:'Courier New',monospace;font-size:26px;font-weight:700;letter-spacing:3px;background:#F3FAF5;border:2px dashed #9BD3AF;border-radius:12px;padding:14px;text-align:center">${vin}</p>`,
		),
	);

export const sendOtpEmail = (to: string, code: string) =>
	send(
		to,
		`${code} is your ${SITE_NAME} sign-in code`,
		layout(
			"Your sign-in code",
			`<p style="line-height:1.6;color:#44544B">Enter this code to continue to the face check. It expires in 10 minutes. If you did not try to sign in, ignore this email.</p>
<p style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center">${code}</p>`,
		),
	);

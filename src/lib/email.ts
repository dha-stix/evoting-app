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

/** Whether the email actually left, and if not (development only) why. */
export type SendResult = { delivered: true } | { delivered: false; reason: string };

const plain = (html: string) => html.replace(/<a [^>]*href="([^"]+)"[^>]*>/g, " $1 ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

function explain(message: string) {
	if (/own email address|testing emails|verify a domain/i.test(message)) {
		return "Resend is in test mode, so it only delivers to the email address of the Resend account. Verify a domain in Resend to email any voter.";
	}
	return `Resend refused the email: ${message}`;
}

async function send(to: string, subject: string, html: string): Promise<SendResult> {
	if (!resend) {
		if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set");
		console.info(`[email] to=${to} subject="${subject}"\n${plain(html)}`);
		return { delivered: false, reason: "No email service is set up (RESEND_API_KEY is empty)." };
	}
	const { error } = await resend.emails.send({ from: from(), to, subject, html });
	if (!error) return { delivered: true };
	if (process.env.NODE_ENV !== "production") {
		// Keep local testing possible: print the email and tell the caller it did not go out.
		console.warn(`[email] not delivered (${error.message}); printing instead.\n[email] to=${to} subject="${subject}"\n${plain(html)}`);
		return { delivered: false, reason: explain(error.message) };
	}
	throw new Error(`Email failed: ${error.message}`);
}

export const sendAdminLinkEmail = (to: string, kind: "invite" | "reset", url: string) =>
	send(
		to,
		kind === "invite" ? `You have been invited to ${SITE_NAME} admin` : `Set a new ${SITE_NAME} admin password`,
		layout(
			kind === "invite" ? "Set up your admin account" : "Reset your password",
			`<p style="line-height:1.6;color:#44544B">${kind === "invite" ? "You have been added as an election administrator. Choose a password to finish setting up your account." : "Use the button below to choose a new password. If you did not ask for this, ignore this email."} The link works once and expires in 1 hour.</p>
<p style="margin:24px 0"><a href="${url}" style="display:inline-block;background:#0A6B3D;color:#ffffff;font-weight:700;text-decoration:none;padding:14px 22px;border-radius:12px">${kind === "invite" ? "Set my password" : "Choose a new password"}</a></p>`,
		),
	);

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

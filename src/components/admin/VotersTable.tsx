"use client";
import { ChevronLeft, ChevronRight, Download, Mail, Search, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Pill } from "@/components/ui/Bits";
import { Silhouette } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Drawer } from "@/components/ui/Overlay";
import { DISTRICTS, ELECTION_STATE, STATES_LGAS } from "@/lib/constants";
import { getVoterDetail, resendVin, setVoterStatus } from "@/lib/supabase-actions";
import { formatDate, formatNumber, fullName, initials } from "@/lib/utils";
import type { VoterRow } from "@/types";
import { PageHeader } from "./AdminShell";

interface Props {
	voters: VoterRow[];
	total: number;
	page: number;
	pageSize: number;
	filters: { q?: string; lga?: string; status?: string };
	canManage: boolean;
}

const HUES = ["#CFE9D8", "#FDE7C7", "#DBE5FF", "#EBDDFB"];

export function VotersTable({ voters, total, page, pageSize, filters, canManage }: Props) {
	const router = useRouter();
	const [selected, setSelected] = useState<VoterRow | null>(null);
	const pages = Math.max(1, Math.ceil(total / pageSize));
	const href = (p: number) => {
		const sp = new URLSearchParams(Object.entries({ ...filters, page: String(p) }).filter(([, v]) => v) as [string, string][]);
		return `/admin/voters?${sp}`;
	};
	const exportHref = `/admin/voters/export?${new URLSearchParams(Object.entries(filters).filter(([, v]) => v) as [string, string][])}`;

	return (
		<>
			<PageHeader
				title="Voters"
				sub={`${formatNumber(total)} ${filters.q || filters.lga || filters.status ? "matching" : "registered"}`}
				icon={Users}
				actions={
					<a href={exportHref} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#CBD5CA] bg-white px-4 font-semibold hover:border-brand/50">
						<Download className="h-[18px] w-[18px]" aria-hidden /> Export CSV
					</a>
				}
			/>
			<form method="get" className="mb-5 flex flex-wrap gap-2.5">
				<label className="relative flex flex-[1_1_280px]">
					<span className="sr-only">Search voters</span>
					<Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" aria-hidden />
					<input name="q" defaultValue={filters.q} placeholder="Search VIN, name, email or last 4 of NIN" className="field h-11 pl-10" />
				</label>
				<Select name="lga" defaultValue={filters.lga ?? ""} aria-label="LGA" className="h-11 w-auto min-w-[170px]">
					<option value="">All LGAs</option>
					{(STATES_LGAS[ELECTION_STATE] ?? []).map((l) => <option key={l}>{l}</option>)}
				</Select>
				<Select name="status" defaultValue={filters.status ?? ""} aria-label="Status" className="h-11 w-auto min-w-[150px]">
					<option value="">Any status</option>
					<option value="active">Active</option>
					<option value="suspended">Suspended</option>
				</Select>
				<Button type="submit" size="sm" className="h-11">
					Filter
				</Button>
			</form>

			<div className="card overflow-hidden rounded-[22px]">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[760px] border-collapse text-[15px]">
						<thead>
							<tr className="bg-ground text-left text-[13px] tracking-[0.04em] text-muted">
								<th scope="col" className="px-[18px] py-3.5 font-bold">VOTER</th>
								<th scope="col" className="px-[18px] py-3.5 font-bold">VIN</th>
								<th scope="col" className="px-[18px] py-3.5 font-bold">LGA</th>
								<th scope="col" className="px-[18px] py-3.5 font-bold">REGISTERED</th>
								<th scope="col" className="px-[18px] py-3.5 font-bold">STATUS</th>
								<th scope="col" className="px-[18px] py-3.5"><span className="sr-only">Actions</span></th>
							</tr>
						</thead>
						<tbody>
							{voters.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-[18px] py-12 text-center text-muted">No voters match.</td>
								</tr>
							) : (
								voters.map((v, i) => (
									<tr key={v.id} className="border-t border-[#EEF2ED] transition-colors hover:bg-[#F3FAF5]">
										<td className="px-[18px] py-3">
											<span className="flex items-center gap-3">
												<span className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold" style={{ background: HUES[i % 4] }}>{initials(`${v.first_name} ${v.last_name}`)}</span>
												<span className="flex flex-col">
													<b>{fullName(v)}</b>
													<span className="text-[13px] text-subtle">
														<span className="capitalize">{v.gender}</span> · {v.email}
													</span>
												</span>
											</span>
										</td>
										<td className="px-[18px] py-3 font-mono text-sm">{v.vin}</td>
										<td className="px-[18px] py-3">{v.home_lga}</td>
										<td className="px-[18px] py-3 text-muted">{formatDate(v.created_at)}</td>
										<td className="px-[18px] py-3">{v.status === "active" ? <Pill>Active</Pill> : <Pill tone="red">Suspended</Pill>}</td>
										<td className="px-[18px] py-3 text-right">
											<Button variant="secondary" size="sm" onClick={() => setSelected(v)}>View</Button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				<div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-[#EEF2ED] px-[18px] py-3.5 text-sm text-subtle">
					<span>
						Page {page} of {pages}
					</span>
					<span className="flex gap-1.5">
						<PageLink href={href(page - 1)} disabled={page <= 1} label="Previous page"><ChevronLeft className="h-5 w-5" /></PageLink>
						<PageLink href={href(page + 1)} disabled={page >= pages} label="Next page"><ChevronRight className="h-5 w-5" /></PageLink>
					</span>
				</div>
			</div>

			<VoterDrawer voter={selected} canManage={canManage} onClose={() => setSelected(null)} onChanged={() => (setSelected(null), router.refresh())} />
		</>
	);
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
	if (disabled) return <span aria-hidden className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-line opacity-40">{children}</span>;
	return <Link href={href} aria-label={label} className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-white hover:border-brand/50">{children}</Link>;
}

function VoterDrawer({ voter, canManage, onClose, onChanged }: { voter: VoterRow | null; canManage: boolean; onClose: () => void; onChanged: () => void }) {
	const [detail, setDetail] = useState<{ photoUrl: string | null; participation: { election_id: number; title: string; voted: boolean }[] } | null>(null);
	const [loadedFor, setLoadedFor] = useState<string | null>(null);
	const [busy, setBusy] = useState<string | null>(null);

	if (voter && loadedFor !== voter.id) {
		setLoadedFor(voter.id);
		setDetail(null);
		getVoterDetail(voter.id).then((r) => (r.ok ? setDetail(r.data) : toast.error(r.error)));
	}

	const act = async (key: string, fn: () => Promise<{ ok: boolean; error?: string }>, success: string, refresh = true) => {
		setBusy(key);
		const res = await fn();
		setBusy(null);
		if (!res.ok) return toast.error(res.error);
		toast.success(success);
		if (refresh) onChanged();
	};

	return (
		<Drawer open={Boolean(voter)} onClose={onClose} title="Voter details">
			{voter && (
				<div className="flex flex-1 flex-col gap-5">
					<div className="flex items-center gap-4">
						<div className="relative flex h-[116px] w-24 shrink-0 items-end justify-center overflow-hidden rounded-2xl bg-brand-100">
							{detail?.photoUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img src={detail.photoUrl} alt={`Photo of ${voter.first_name}`} className="absolute inset-0 h-full w-full object-cover" />
							) : (
								<Silhouette className="h-[90%] w-[90%]" tone="#7FB394" />
							)}
						</div>
						<div className="flex min-w-0 flex-col gap-1">
							<b className="text-xl">{fullName(voter)}</b>
							<span className="font-mono text-muted">{voter.vin}</span>
							{voter.status === "active" ? <Pill>Active</Pill> : <Pill tone="red">Suspended</Pill>}
						</div>
					</div>
					<dl className="grid grid-cols-2 gap-3.5">
						<Detail label="NIN" value={`••••••• ${voter.nin_last4}`} mono />
						<Detail label="Date of birth" value={formatDate(voter.date_of_birth)} />
						<Detail label="LGA" value={voter.home_lga} />
						<Detail label="District" value={DISTRICTS[voter.district]} />
						<Detail label="Email" value={voter.email} />
						<Detail label="Registered" value={formatDate(voter.created_at)} />
					</dl>
					<section className="flex flex-col gap-2.5">
						<h3 className="text-[15px] font-semibold text-subtle">Participation</h3>
						{!detail ? (
							<p className="text-sm text-subtle">Loading…</p>
						) : detail.participation.length === 0 ? (
							<p className="text-sm text-subtle">No elections yet.</p>
						) : (
							detail.participation.map((p) => (
								<div key={p.election_id} className="flex justify-between gap-3 rounded-xl bg-ground px-3.5 py-3">
									<span className="truncate">{p.title}</span>
									<b className={p.voted ? "text-brand" : "text-muted"}>{p.voted ? "Voted" : "Not voted"}</b>
								</div>
							))
						)}
						<p className="text-[13px] text-subtle">Only whether they voted is stored, never who they chose.</p>
					</section>
					{canManage && (
						<div className="mt-auto grid grid-cols-2 gap-2.5">
							<Button variant="secondary" loading={busy === "vin"} onClick={() => act("vin", () => resendVin(voter.id), "VIN email sent", false)}>
								<Mail className="h-[18px] w-[18px]" aria-hidden /> Resend VIN
							</Button>
							{voter.status === "active" ? (
								<Button variant="danger" loading={busy === "status"} onClick={() => confirm("Suspend this voter? They will not be able to sign in or vote.") && act("status", () => setVoterStatus(voter.id, "suspended"), "Voter suspended")}>
									Suspend
								</Button>
							) : (
								<Button loading={busy === "status"} onClick={() => act("status", () => setVoterStatus(voter.id, "active"), "Voter reinstated")}>
									Reinstate
								</Button>
							)}
						</div>
					)}
				</div>
			)}
		</Drawer>
	);
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
	return (
		<div className="min-w-0">
			<dt className="text-[13px] text-subtle">{label}</dt>
			<dd className={`mt-0.5 truncate ${mono ? "font-mono" : ""}`}>{value}</dd>
		</div>
	);
}

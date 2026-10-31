"use client";
import { AlertTriangle, BarChart3, Plus, Send, Trash2, Vote } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Segmented, StatusPill } from "@/components/ui/Bits";
import { PartyBadge } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Drawer, Modal } from "@/components/ui/Overlay";
import { rankCandidates } from "@/components/results/TallyBars";
import { DISTRICTS } from "@/lib/constants";
import { createElection, deleteElection, endElectionEarly, publishElection } from "@/lib/supabase-actions";
import { cn, countdown, formatDateTime, formatNumber, percent } from "@/lib/utils";
import type { Candidate, District, ElectionStatus, ElectionType } from "@/types";
import type { ElectionWithBallot } from "@/lib/queries";
import { PageHeader } from "./AdminShell";

type Row = ElectionWithBallot & { status: ElectionStatus };
const TABS: { value: ElectionStatus; label: string }[] = [
	{ value: "live", label: "Live" },
	{ value: "scheduled", label: "Scheduled" },
	{ value: "draft", label: "Drafts" },
	{ value: "ended", label: "Ended" },
];

const toLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function ElectionsManager({ elections, candidates, participation, eligible, canManage }: { elections: Row[]; candidates: Candidate[]; participation: Record<string, number>; eligible: Record<string, number>; canManage: boolean }) {
	const router = useRouter();
	const params = useSearchParams();
	const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.value, elections.filter((e) => e.status === t.value).length])), [elections]);
	const [tab, setTab] = useState<ElectionStatus>(counts.live ? "live" : counts.scheduled ? "scheduled" : counts.draft ? "draft" : "ended");
	const [creating, setCreating] = useState(params.get("new") === "1" && canManage);
	const [ending, setEnding] = useState<Row | null>(null);
	const [now, setNow] = useState(Date.now());
	const [pending, startTransition] = useTransition();

	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
		startTransition(async () => {
			const res = await fn();
			if (!res.ok) return void toast.error(res.error);
			toast.success(success);
			router.refresh();
		});

	const rows = elections.filter((e) => e.status === tab);

	return (
		<>
			<PageHeader
				title="Elections"
				sub="Schedule, run and close elections. They open and close on time automatically."
				icon={Vote}
				actions={
					canManage && (
						<Button size="sm" className="h-11" onClick={() => setCreating(true)} lift>
							<Plus className="h-[18px] w-[18px]" aria-hidden /> Create election
						</Button>
					)
				}
			/>
			<div className="mb-5 overflow-x-auto">
				<Segmented label="Filter elections" value={tab} onChange={setTab} options={TABS.map((t) => ({ value: t.value, label: <span className="whitespace-nowrap">{t.label} <span className="ml-1 rounded-full bg-[#DDE4DC] px-1.5 py-0.5 text-xs">{counts[t.value]}</span></span> }))} />
			</div>

			{rows.length === 0 ? (
				<div className="card flex flex-col items-center gap-3 p-12 text-center">
					<Vote className="draw-in h-10 w-10 text-brand" strokeWidth={1.6} aria-hidden />
					<p className="text-muted">No {TABS.find((t) => t.value === tab)!.label.toLowerCase()} elections.</p>
				</div>
			) : (
				<div className="flex flex-col gap-3.5">
					{rows.map((e) => {
						const { total, rows: ranked } = rankCandidates(e.candidates, e.tallies);
						const voted = participation[String(e.id)] ?? 0;
						const elig = eligible[e.district ?? "state"] ?? 0;
						return (
							<article key={e.id} className="card flex animate-rise flex-wrap items-center gap-5 rounded-[22px] p-[22px]">
								<div className="flex min-w-0 flex-[2_1_260px] flex-col gap-1.5">
									<StatusPill status={e.status} />
									<h2 className="h-display truncate text-[21px]">{e.title}</h2>
									<span className="text-sm text-subtle">
										{formatDateTime(e.starts_at)} → {formatDateTime(e.ends_at)}
										{e.ended_early_at && " · ended early"}
									</span>
								</div>
								<div className="flex flex-[1_1_200px] flex-col gap-2">
									{e.status === "live" || e.status === "ended" ? (
										<>
											<div className="flex justify-between text-sm">
												<span className="text-subtle">Turnout</span>
												<b>{percent(voted, elig)}</b>
											</div>
											<div className="h-2 rounded-full bg-[#EEF2ED]">
												<div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: percent(voted, elig) }} />
											</div>
											<span className="text-[13px] text-subtle">
												{formatNumber(total)} votes · {e.status === "live" ? `${countdown(+new Date(e.ends_at) - now)} left` : ranked[0]?.votes ? `Winner: ${ranked[0].candidate.full_name} (${ranked[0].candidate.party?.acronym})` : "No votes"}
											</span>
										</>
									) : (
										<div className="flex -space-x-2">
											{e.candidates.map((c) => c.party && <PartyBadge key={c.id} party={c.party} size={34} className="ring-2 ring-white" />)}
											<span className="pl-4 text-sm text-subtle">{e.candidates.length} candidates</span>
										</div>
									)}
								</div>
								<div className="flex flex-[1_1_200px] flex-wrap justify-end gap-2">
									<Link href="/results" className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#CBD5CA] px-4 font-semibold hover:border-brand/50">
										<BarChart3 className="h-[18px] w-[18px]" aria-hidden /> Results
									</Link>
									{canManage && e.status === "live" && (
										<Button variant="danger" className="h-11" onClick={() => setEnding(e)}>
											End early
										</Button>
									)}
									{canManage && e.status === "draft" && (
										<Button className="h-11" loading={pending} onClick={() => run(() => publishElection(e.id), "Election scheduled")}>
											<Send className="h-4 w-4" aria-hidden /> Publish
										</Button>
									)}
									{canManage && (e.status === "draft" || e.status === "scheduled") && (
										<Button
											variant="danger"
											size="icon"
											aria-label={`Delete ${e.title}`}
											onClick={() => confirm(`Delete "${e.title}"? This cannot be undone.`) && run(() => deleteElection(e.id), "Election deleted")}
										>
											<Trash2 className="h-[18px] w-[18px]" />
										</Button>
									)}
								</div>
							</article>
						);
					})}
				</div>
			)}

			<CreateElectionDrawer open={creating} onClose={() => setCreating(false)} candidates={candidates} onCreated={() => (setCreating(false), router.refresh())} />

			<Modal open={Boolean(ending)} onClose={() => setEnding(null)} title="End election early" role="alertdialog">
				{ending && <EndEarly election={ending} onCancel={() => setEnding(null)} onDone={() => (setEnding(null), router.refresh())} />}
			</Modal>
		</>
	);
}

function EndEarly({ election, onCancel, onDone }: { election: Row; onCancel: () => void; onDone: () => void }) {
	const [typed, setTyped] = useState("");
	const [busy, setBusy] = useState(false);
	return (
		<div className="flex flex-col gap-4">
			<span className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-danger-bg text-danger">
				<AlertTriangle className="h-[26px] w-[26px]" aria-hidden />
			</span>
			<h2 className="h-display text-2xl font-extrabold">End “{election.title}” now?</h2>
			<p className="leading-relaxed text-muted">
				Voting closes immediately for everyone and the results become final. Type <b className="font-mono">END</b> to confirm.
			</p>
			<Input value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Type END to confirm" placeholder="END" data-autofocus />
			<div className="grid grid-cols-2 gap-2.5">
				<Button variant="secondary" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					variant="solidDanger"
					disabled={typed !== "END"}
					loading={busy}
					onClick={async () => {
						setBusy(true);
						const res = await endElectionEarly(election.id);
						setBusy(false);
						if (!res.ok) return toast.error(res.error);
						toast.success("Election ended");
						onDone();
					}}
				>
					End election
				</Button>
			</div>
		</div>
	);
}

function CreateElectionDrawer({ open, onClose, candidates, onCreated }: { open: boolean; onClose: () => void; candidates: Candidate[]; onCreated: () => void }) {
	const [type, setType] = useState<ElectionType>("governorship");
	const [district, setDistrict] = useState<District>("central");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startNow, setStartNow] = useState(false);
	const [startsAt, setStartsAt] = useState(() => toLocal(new Date(Date.now() + 86400000)));
	const [endsAt, setEndsAt] = useState(() => toLocal(new Date(Date.now() + 86400000 + 10 * 3600000)));
	const [picked, setPicked] = useState<number[]>([]);
	const [error, setError] = useState<{ field?: string; message: string } | null>(null);
	const [busy, setBusy] = useState(false);

	const eligible = candidates.filter((c) => c.type === type && (type === "governorship" || c.district === district));
	useEffect(() => {
		setPicked(eligible.map((c) => c.id));
		setTitle(type === "governorship" ? `Ondo Governorship ${new Date().getFullYear() + 1}` : `Senatorial · ${DISTRICTS[district]}`);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [type, district, candidates]);

	const submit = async (isDraft: boolean) => {
		setBusy(true);
		setError(null);
		const res = await createElection({
			title,
			type,
			district: type === "senatorial" ? district : null,
			description,
			starts_at: startNow ? new Date().toISOString() : new Date(startsAt).toISOString(),
			ends_at: new Date(endsAt).toISOString(),
			candidate_ids: picked,
			is_draft: isDraft,
		});
		setBusy(false);
		if (!res.ok) return setError({ field: res.field, message: res.error });
		toast.success(isDraft ? "Draft saved" : startNow ? "Election is live" : "Election scheduled");
		onCreated();
	};

	const errFor = (f: string) => (error?.field === f ? error.message : undefined);

	return (
		<Drawer open={open} onClose={onClose} title="New election">
			<div className="flex flex-1 flex-col gap-5">
				<div className="flex flex-col gap-2">
					<span className="text-sm font-semibold text-[#26362D]">Office</span>
					<Segmented label="Office" value={type} onChange={setType} options={[{ value: "governorship", label: "Governorship" }, { value: "senatorial", label: "Senatorial" }]} className="w-full" />
				</div>
				{type === "senatorial" && (
					<Field label="District" error={errFor("district")}>
						{(p) => (
							<Select {...p} value={district} onChange={(e) => setDistrict(e.target.value as District)}>
								{Object.entries(DISTRICTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
							</Select>
						)}
					</Field>
				)}
				<Field label="Title" error={errFor("title")}>{(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
				<Field label="Description" hint="Optional, shown on the results page">{(p) => <Textarea {...p} value={description} onChange={(e) => setDescription(e.target.value)} />}</Field>
				<label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3.5 font-semibold">
					<input type="checkbox" checked={startNow} onChange={(e) => setStartNow(e.target.checked)} className="h-5 w-5 accent-brand" />
					Open voting immediately
				</label>
				<div className="grid gap-3 sm:grid-cols-2">
					{!startNow && <Field label="Opens" error={errFor("starts_at")}>{(p) => <Input {...p} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />}</Field>}
					<Field label="Closes" error={errFor("ends_at")} className={cn(startNow && "sm:col-span-2")}>{(p) => <Input {...p} type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />}</Field>
				</div>
				<fieldset className="flex flex-col gap-2.5">
					<legend className="mb-2 text-sm font-semibold text-[#26362D]">Candidates on the ballot</legend>
					{eligible.length === 0 ? (
						<p className="rounded-xl bg-warn-bg p-3.5 text-sm text-warn">
							No candidates for this office yet. <Link href="/admin/candidates" className="font-semibold underline">Add candidates</Link> first.
						</p>
					) : (
						eligible.map((c) => (
							<label key={c.id} className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border border-line px-3.5 hover:border-brand/40">
								<input type="checkbox" checked={picked.includes(c.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))} className="h-[18px] w-[18px] accent-brand" />
								{c.party && <PartyBadge party={c.party} size={32} />}
								<span className="flex-1">{c.full_name}</span>
							</label>
						))
					)}
					{errFor("candidate_ids") && <p role="alert" className="text-[13px] font-medium text-danger">{errFor("candidate_ids")}</p>}
				</fieldset>
				{error && !error.field && <p role="alert" className="rounded-xl bg-danger-bg p-3 text-sm text-danger">{error.message}</p>}
				<div className="mt-auto grid grid-cols-2 gap-2.5 pt-2">
					<Button variant="secondary" size="lg" onClick={() => submit(true)} disabled={busy}>
						Save draft
					</Button>
					<Button size="lg" onClick={() => submit(false)} loading={busy}>
						{startNow ? "Start now" : "Schedule"}
					</Button>
				</div>
			</div>
		</Drawer>
	);
}

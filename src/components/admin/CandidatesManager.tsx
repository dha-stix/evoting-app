"use client";
import { Pencil, Plus, Search, Trash2, Upload, UserRound } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Segmented } from "@/components/ui/Bits";
import { PartyBadge, Silhouette } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Drawer, DrawerFooter } from "@/components/ui/Overlay";
import { DISTRICTS, STORAGE, districtLgaList } from "@/lib/constants";
import { deleteCandidate, saveCandidate } from "@/lib/supabase-actions";
import { publicStorageUrl } from "@/lib/utils";
import type { Candidate, ElectionType, Party } from "@/types";
import { PageHeader } from "./AdminShell";

export function CandidatesManager({ candidates, parties, canManage }: { candidates: Candidate[]; parties: Party[]; canManage: boolean }) {
	const router = useRouter();
	const [type, setType] = useState<ElectionType>("governorship");
	const [query, setQuery] = useState("");
	const [editing, setEditing] = useState<Candidate | "new" | null>(null);

	const groups = useMemo(() => {
		const q = query.trim().toLowerCase();
		const list = candidates.filter((c) => c.type === type && (!q || c.full_name.toLowerCase().includes(q) || c.party?.acronym.toLowerCase().includes(q) || c.party?.name.toLowerCase().includes(q)));
		if (type === "governorship") return [{ title: "Governorship · Ondo State", items: list }];
		return (Object.keys(DISTRICTS) as (keyof typeof DISTRICTS)[]).map((d) => ({ title: DISTRICTS[d], items: list.filter((c) => c.district === d) })).filter((g) => g.items.length);
	}, [candidates, type, query]);

	const remove = async (c: Candidate) => {
		if (!confirm(`Remove ${c.full_name}?`)) return;
		const res = await deleteCandidate(c.id);
		if (!res.ok) return toast.error(res.error);
		toast.success("Candidate removed");
		router.refresh();
	};

	return (
		<>
			<PageHeader
				title="Candidates"
				sub="One candidate per party for each office."
				icon={UserRound}
				actions={
					canManage && (
						<Button size="sm" className="h-11" onClick={() => setEditing("new")} lift>
							<Plus className="h-[18px] w-[18px]" aria-hidden /> Add candidate
						</Button>
					)
				}
			/>
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<Segmented label="Office" value={type} onChange={setType} options={[{ value: "governorship", label: "Governorship" }, { value: "senatorial", label: "Senatorial" }]} />
				<label className="relative flex w-full sm:w-[300px]">
					<span className="sr-only">Search candidates</span>
					<Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" aria-hidden />
					<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or party" className="field h-11 pl-10" />
				</label>
			</div>

			{groups.every((g) => g.items.length === 0) ? (
				<div className="card flex flex-col items-center gap-3 p-12 text-center">
					<UserRound className="draw-in h-10 w-10 text-brand" strokeWidth={1.6} aria-hidden />
					<p className="text-muted">No {type} candidates yet.</p>
				</div>
			) : (
				groups.map((g) => (
					<section key={g.title} className="mb-8 flex flex-col gap-3.5">
						<h2 className="text-[15px] font-bold uppercase tracking-[0.04em] text-subtle">{g.title}</h2>
						<div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-4">
							{g.items.map((c, i) => {
								const photo = publicStorageUrl(STORAGE.candidatePhotos, c.photo_path);
								return (
									<article key={c.id} className="card lift flex animate-rise flex-col gap-3.5 rounded-[22px] p-4" style={{ animationDelay: `${i * 0.04}s` }}>
										<div className="relative flex aspect-[4/3] items-end justify-center overflow-hidden rounded-2xl bg-[#EEF2ED]">
											{photo ? <Image src={photo} alt={c.full_name} fill sizes="260px" className="object-cover" /> : <Silhouette className="h-[88%] w-[60%]" />}
											{c.party && <PartyBadge party={c.party} size={40} className="absolute left-2.5 top-2.5 ring-[3px] ring-white" />}
										</div>
										<div>
											<b className="text-[17px]">{c.full_name}</b>
											<div className="mt-0.5 text-sm text-subtle">{c.party?.name}</div>
											{c.running_mate && <div className="text-[13px] text-subtle">Running mate: {c.running_mate}</div>}
										</div>
										{canManage && (
											<div className="flex gap-2">
												<Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditing(c)}>
													<Pencil className="h-4 w-4" aria-hidden /> Edit
												</Button>
												<Button variant="danger" size="icon" className="h-10 w-10" aria-label={`Remove ${c.full_name}`} onClick={() => remove(c)}>
													<Trash2 className="h-[18px] w-[18px]" />
												</Button>
											</div>
										)}
									</article>
								);
							})}
						</div>
					</section>
				))
			)}

			<CandidateDrawer key={editing === "new" ? "new" : editing?.id ?? "none"} candidate={editing} parties={parties} defaultType={type} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), router.refresh())} />
		</>
	);
}

function CandidateDrawer({ candidate, parties, defaultType, onClose, onSaved }: { candidate: Candidate | "new" | null; parties: Party[]; defaultType: ElectionType; onClose: () => void; onSaved: () => void }) {
	const existing = candidate && candidate !== "new" ? candidate : null;
	const [type, setType] = useState<ElectionType>(existing?.type ?? defaultType);
	const [preview, setPreview] = useState<string | null>(existing ? publicStorageUrl(STORAGE.candidatePhotos, existing.photo_path) : null);
	const [error, setError] = useState<{ field?: string; message: string } | null>(null);
	const [busy, setBusy] = useState(false);

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setBusy(true);
		const fd = new FormData(e.currentTarget);
		fd.set("type", type);
		if (type === "governorship") fd.delete("district");
		if (existing) fd.set("id", String(existing.id));
		const res = await saveCandidate(fd);
		setBusy(false);
		if (!res.ok) return setError({ field: res.field, message: res.error });
		toast.success(existing ? "Candidate updated" : "Candidate added");
		onSaved();
	};
	const errFor = (f: string) => (error?.field === f ? error.message : undefined);

	return (
		<Drawer open={candidate !== null} onClose={onClose} title={existing ? "Edit candidate" : "Add candidate"}>
			<form onSubmit={onSubmit} className="flex flex-1 flex-col gap-[18px]">
				<label className="relative flex h-40 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] border-2 border-dashed border-[#CBD5CA] bg-[#F8FAF7] text-center text-muted hover:border-brand/50">
					{preview ? (
						// eslint-disable-next-line @next/next/no-img-element
						<img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
					) : (
						<>
							<Upload className="h-7 w-7 animate-float text-brand" aria-hidden />
							<b className="text-[15px] text-ink">Upload photo</b>
							<span className="text-[13px]">JPG, PNG or WebP, up to 2 MB</span>
						</>
					)}
					<input name="photo" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && setPreview(URL.createObjectURL(e.target.files[0]))} />
				</label>
				{errFor("photo") && <p role="alert" className="-mt-2 text-[13px] text-danger">{errFor("photo")}</p>}
				<Field label="Full name" error={errFor("full_name")}>{(p) => <Input {...p} name="full_name" defaultValue={existing?.full_name} required />}</Field>
				<Field label="Party" error={errFor("party_id")}>
					{(p) => (
						<Select {...p} name="party_id" defaultValue={existing?.party_id ?? ""} required>
							<option value="" disabled>Choose a party</option>
							{parties.map((party) => <option key={party.id} value={party.id}>{party.name} ({party.acronym})</option>)}
						</Select>
					)}
				</Field>
				<div className="flex flex-col gap-2">
					<span className="text-sm font-semibold text-[#26362D]">Office</span>
					<Segmented label="Candidate office" value={type} onChange={setType} options={[{ value: "governorship", label: "Governorship" }, { value: "senatorial", label: "Senatorial" }]} className="w-full" />
				</div>
				{type === "senatorial" ? (
					<Field label="District" error={errFor("district")}>
						{(p) => (
							<Select {...p} name="district" defaultValue={existing?.district ?? "central"}>
								{Object.entries(DISTRICTS).map(([k, v]) => <option key={k} value={k}>{v} ({districtLgaList(k as keyof typeof DISTRICTS)})</option>)}
							</Select>
						)}
					</Field>
				) : (
					<Field label="Running mate" hint="Optional">{(p) => <Input {...p} name="running_mate" defaultValue={existing?.running_mate ?? ""} />}</Field>
				)}
				{error && !["photo", "full_name", "party_id", "district"].includes(error.field ?? "") && <p role="alert" className="rounded-xl bg-danger-bg p-3 text-sm text-danger">{error.message}</p>}
				<DrawerFooter>
					<Button variant="secondary" size="lg" onClick={onClose}>Cancel</Button>
					<Button type="submit" size="lg" loading={busy}>Save candidate</Button>
				</DrawerFooter>
			</form>
		</Drawer>
	);
}

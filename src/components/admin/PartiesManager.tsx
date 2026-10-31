"use client";
import { Flag, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { PartyBadge } from "@/components/ui/Brand";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { STORAGE } from "@/lib/constants";
import { deleteParty, saveParty } from "@/lib/supabase-actions";
import { cn, publicStorageUrl } from "@/lib/utils";
import type { Party } from "@/types";
import { PageHeader } from "./AdminShell";

type Row = Party & { candidateCount: number };
const SWATCHES = ["#1D4ED8", "#C1121F", "#15803D", "#0E7490", "#9D174D", "#A16207", "#C2410C", "#6D28D9", "#0D1B14"];
const acronymOf = (name: string) =>
	name
		.split(/\s+/)
		.filter((w) => w && !["of", "and", "the", "for"].includes(w.toLowerCase()))
		.map((w) => w[0]!.toUpperCase())
		.join("")
		.slice(0, 8);

export function PartiesManager({ parties, canManage }: { parties: Row[]; canManage: boolean }) {
	const router = useRouter();
	const formRef = useRef<HTMLFormElement>(null);
	const [editing, setEditing] = useState<Row | null>(null);
	const [name, setName] = useState("");
	const [acronym, setAcronym] = useState("");
	const [acronymTouched, setAcronymTouched] = useState(false);
	const [color, setColor] = useState(SWATCHES[0]!);
	const [logo, setLogo] = useState<string | null>(null);
	const [error, setError] = useState<{ field?: string; message: string } | null>(null);
	const [busy, setBusy] = useState(false);

	const load = (p: Row | null) => {
		setEditing(p);
		setName(p?.name ?? "");
		setAcronym(p?.acronym ?? "");
		setAcronymTouched(Boolean(p));
		setColor(p?.color ?? SWATCHES[0]!);
		setLogo(p ? publicStorageUrl(STORAGE.partyLogos, p.logo_path) : null);
		setError(null);
		formRef.current?.reset();
		if (p) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	};

	const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setBusy(true);
		const fd = new FormData(e.currentTarget);
		fd.set("name", name);
		fd.set("acronym", acronym);
		fd.set("color", color);
		if (editing) fd.set("id", String(editing.id));
		const res = await saveParty(fd);
		setBusy(false);
		if (!res.ok) return setError({ field: res.field, message: res.error });
		toast.success(editing ? "Party updated" : "Party registered");
		load(null);
		router.refresh();
	};

	const remove = async (p: Row) => {
		if (!confirm(`Remove ${p.name}?`)) return;
		const res = await deleteParty(p.id);
		if (!res.ok) return toast.error(res.error);
		toast.success("Party removed");
		if (editing?.id === p.id) load(null);
		router.refresh();
	};

	return (
		<>
			<PageHeader
				title="Political parties"
				sub={
					<>
						{parties.length} parties · <a href="https://inecnigeria.org/parties" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">INEC register</a>
					</>
				}
				icon={Flag}
			/>
			<div className="flex flex-wrap items-start gap-6">
				<section className="grid min-w-0 flex-[999_1_420px] grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-4">
					{parties.map((p, i) => (
						<article key={p.id} className={cn("card lift flex animate-rise flex-col gap-4 rounded-[22px] p-5", editing?.id === p.id && "border-brand")} style={{ animationDelay: `${Math.min(i, 12) * 0.03}s` }}>
							<div className="flex items-center gap-3.5">
								<PartyBadge party={p} size={56} className="animate-pop" />
								<div className="min-w-0">
									<b className="block text-[16px] leading-tight">{p.name}</b>
									<span className="font-mono text-[13px] text-subtle">{p.acronym}</span>
								</div>
							</div>
							<div className="flex items-center justify-between border-t border-[#EEF2ED] pt-3.5 text-sm">
								<span className="text-subtle">
									{p.candidateCount} candidate{p.candidateCount === 1 ? "" : "s"}
									{!p.logo_path && " · no logo"}
								</span>
								{canManage && (
									<span className="flex gap-1">
										<button type="button" onClick={() => load(p)} className="min-h-10 rounded-lg px-2.5 font-semibold text-brand hover:bg-brand-50">
											Edit
										</button>
										<button type="button" onClick={() => remove(p)} aria-label={`Remove ${p.name}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-danger hover:bg-danger-bg">
											<Trash2 className="h-4 w-4" />
										</button>
									</span>
								)}
							</div>
						</article>
					))}
				</section>

				{canManage && (
					<aside className="card flex-[1_1_320px] rounded-3xl p-6 lg:sticky lg:top-6">
						<form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-[18px]">
							<h2 className="h-display text-[22px]">{editing ? `Edit ${editing.acronym}` : "Register a party"}</h2>
							<div className="flex items-center gap-3.5 rounded-2xl bg-ground p-3.5">
								{logo ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={logo} alt="" className="h-[52px] w-[52px] rounded-full bg-white object-contain p-1 ring-1 ring-line" />
								) : (
									<PartyBadge party={{ name: name || "New party", acronym: acronym || "—", color, logo_path: null }} size={52} />
								)}
								<div className="min-w-0">
									<span className="text-xs font-semibold text-subtle">LIVE PREVIEW</span>
									<b className="block truncate">{name || "Party name"}</b>
								</div>
							</div>
							<Field label="Party name" error={error?.field === "name" ? error.message : undefined}>
								{(p) => <Input {...p} value={name} onChange={(e) => (setName(e.target.value), !acronymTouched && setAcronym(acronymOf(e.target.value)))} placeholder="e.g. Democratic Leadership Alliance" />}
							</Field>
							<Field label="Acronym" hint="Filled in from the name. You can change it." error={error?.field === "acronym" ? error.message : undefined}>
								{(p) => <Input {...p} value={acronym} onChange={(e) => (setAcronym(e.target.value.toUpperCase()), setAcronymTouched(true))} className="font-mono uppercase" maxLength={8} />}
							</Field>
							<fieldset>
								<legend className="mb-2 text-sm font-semibold text-[#26362D]">Badge colour</legend>
								<div className="flex flex-wrap gap-2.5">
									{SWATCHES.map((c) => (
										<button key={c} type="button" onClick={() => setColor(c)} aria-label={`Colour ${c}`} aria-pressed={color === c} className={cn("h-10 w-10 rounded-full border-[3px] border-white transition-shadow", color === c ? "ring-2 ring-ink" : "ring-1 ring-line")} style={{ background: c }} />
									))}
									<label className="relative h-10 w-10 cursor-pointer overflow-hidden rounded-full ring-1 ring-line" title="Custom colour">
										<span className="sr-only">Custom colour</span>
										<input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="absolute -inset-2 h-14 w-14 cursor-pointer" />
									</label>
								</div>
							</fieldset>
							<label className="relative flex h-[132px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[18px] border-2 border-dashed border-[#CBD5CA] bg-[#F8FAF7] text-center text-muted hover:border-brand/50">
								<Upload className="h-7 w-7 animate-float text-brand" aria-hidden />
								<b className="text-[15px] text-ink">Upload official logo</b>
								<span className="text-[13px]">From the party or INEC · SVG, PNG or WebP</span>
								<input name="logo" type="file" accept="image/svg+xml,image/png,image/webp,image/jpeg" className="sr-only" onChange={(e) => e.target.files?.[0] && setLogo(URL.createObjectURL(e.target.files[0]))} />
							</label>
							{error && (!error.field || error.field === "logo" || error.field === "color") && <p role="alert" className="rounded-xl bg-danger-bg p-3 text-sm text-danger">{error.message}</p>}
							<div className="flex gap-2.5">
								{editing && (
									<Button variant="secondary" size="lg" onClick={() => load(null)}>
										Cancel
									</Button>
								)}
								<Button type="submit" size="lg" className="flex-1" loading={busy} lift>
									{editing ? "Save changes" : "Register party"}
								</Button>
							</div>
						</form>
					</aside>
				)}
			</div>
		</>
	);
}

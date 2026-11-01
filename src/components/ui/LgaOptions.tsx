import { DISTRICTS } from "@/lib/constants";
import { DISTRICT_ORDER, LGAS_BY_DISTRICT } from "@/lib/data/ondo";

/** Ondo LGAs as <option>s grouped under their senatorial district. */
export function LgaOptions({ withHeadquarters }: { withHeadquarters?: boolean }) {
	return (
		<>
			{DISTRICT_ORDER.map((d) => (
				<optgroup key={d} label={`${DISTRICTS[d]} senatorial district`}>
					{LGAS_BY_DISTRICT[d].map((l) => (
						<option key={l.name} value={l.name}>
							{withHeadquarters ? `${l.name} (${l.headquarters})` : l.name}
						</option>
					))}
				</optgroup>
			))}
		</>
	);
}

/**
 * Elections run on Nigerian time (WAT, UTC+1, no daylight saving), whatever
 * timezone the admin's device is set to.
 */
export const WAT_OFFSET = "+01:00";
const WAT_MS = 60 * 60 * 1000;

/** Date → "YYYY-MM-DDTHH:mm" in WAT, for <input type="datetime-local">. */
export function toWatInput(date: Date | number) {
	return new Date(new Date(date).getTime() + WAT_MS).toISOString().slice(0, 16);
}

/** "YYYY-MM-DDTHH:mm" entered as WAT → Date. */
export function fromWatInput(value: string) {
	return new Date(`${value}:00${WAT_OFFSET}`);
}

/** Midnight at the start of the given day in WAT. */
export function startOfWatDay(date: Date | number) {
	return fromWatInput(`${toWatInput(date).slice(0, 10)}T00:00`);
}

export const formatWat = (date: Date | number) =>
	new Intl.DateTimeFormat("en-NG", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Lagos" }).format(new Date(date)) + " WAT";

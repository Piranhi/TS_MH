export function prettify(name: string) {
	return name[0].toUpperCase() + name.slice(1);
}

export function formatTime(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ${hours % 24}h`;
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	if (minutes > 0) return `${minutes}m`;
	return `${seconds}s`;
}

export function formatTimeFull(ms: number): string {
	let totalSeconds = Math.floor(ms / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	totalSeconds %= 3600;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const pad = (n: number) => n.toString().padStart(2, "0");
	return `${hours}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatNumberShort(value: number, fixed?: number): string {
	const units = ["", "k", "m", "b", "t"];
	let unitIndex = 0;
	while (Math.abs(value) >= 1000 && unitIndex < units.length - 1) {
		value /= 1000;
		unitIndex++;
	}
	let str = value.toFixed(fixed ?? 1);
	if (str.endsWith(".0")) str = str.slice(0, -2);
	return str + units[unitIndex];
}

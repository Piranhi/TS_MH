import { StatKey } from "@/models/Stats";

export class StatusEffect {
	public isFinished = false;
	constructor(
		private readonly _id: string,
		private _duration: number,
		private _value: number,
		private _statKey: StatKey,
		private _statusEffectType: "buff" | "debuff"
	) {}

	get id(): string {
		return this._id;
	}

	get duration(): number {
		return this._duration;
	}

	set duration(value: number) {
		this._duration = value;
	}

	get value(): number {
		return this._value;
	}

	set value(value: number) {
		this._value = value;
	}

	handleTick(dt: number) {
		this.duration -= dt;
		if (this.duration <= 0) {
			this.onFinished();
			return false;
		}
		return true;
	}

	apply() {}

	get remaining(): number {
		return this.duration;
	}

	private onFinished() {
		this.isFinished = true;
	}
}

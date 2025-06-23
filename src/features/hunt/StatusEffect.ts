export class StatusEffect {
	public isFinished = false;
	constructor(private duration: number) {}

	handleTick(dt: number) {
		this.duration -= dt;
		if (this.duration <= 0) {
			this.onFinished();
			return false;
		}
		return true;
	}

	apply() {}

	private onFinished() {
		this.isFinished = true;
	}
}

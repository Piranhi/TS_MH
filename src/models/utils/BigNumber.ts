/**
 * Represents a number as mantissa × 10^exponent.
 * mantissa: always in [1, 10) (except for zero).
 */

export class BigNumber {
	mantissa: number; // the “significand”
	exponent: number; // power of ten

	/**
	 * Construct from a JS number.
	 * @param value any finite number
	 */
	constructor(value: number) {
		if (value === 0) {
			this.mantissa = 0;
			this.exponent = 0;
		} else {
			const exp = Math.floor(Math.log10(Math.abs(value)));
			this.exponent = exp; // how many tens to shift
			this.mantissa = value / 10 ** exp;
		}
		this.normalise();
	}

	/** Ensure mantissa is in [1,10) or zero, adjust exponent */
	private normalise() {
		if (this.mantissa === 0) {
			this.exponent = 0;
			return;
		}

		// ① While the mantissa is too big (≥10), shift one power of ten out
		while (Math.abs(this.mantissa) >= 10) {
			this.mantissa /= 10;
			this.exponent++;
		}

		// ② While the mantissa is too small (<1), pull in one power of ten
		while (Math.abs(this.mantissa) < 1) {
			this.mantissa *= 10;
			this.exponent--;
		}
	}

	/**
	 * Multiply two BigNumbers.
	 * @param other
	 */

	multiply(other: BigNumber | number): BigNumber {
		if (typeof other === "number") {
			other = new BigNumber(other);
		}
		const result = new BigNumber(1);
		result.mantissa = this.mantissa * other.mantissa;
		result.exponent = this.exponent + other.exponent;
		result.normalise();
		return result;
	}

	/**
	 * Add two BigNumbers.
	 * Note: we align exponents first for correct addition.
	 */
	add(other: BigNumber | number): BigNumber {
		if (typeof other === "number") {
			other = new BigNumber(other);
		}
		// if one is zero, quick return
		if (this.mantissa === 0) return other;
		if (other.mantissa === 0) return this;

		// make 'this' the larger exponent
		let a: BigNumber = this,
			b: BigNumber = other;
		if (b.exponent > a.exponent) [a, b] = [b, a];

		const diff = a.exponent - b.exponent;
		// shift b's mantissa down so exponents match
		const shiftedMantissa = b.mantissa / 10 ** diff;

		const result = new BigNumber(1);
		result.exponent = a.exponent;
		result.mantissa = a.mantissa + shiftedMantissa;
		result.normalise();
		return result;
	}

	/** Format for display, e.g. “1.23e45” or “0” */
	toString(decimalPlaces = 2): string {
		if (this.mantissa === 0) return "0";

		// 1) Map from a power-of-ten exponent to its English name
		//    keys are exponents (multiples of 3), values are suffixes.
		const suffixes: Record<number, string> = {
			3: "thousand",
			6: "million",
			9: "billion",
			12: "trillion",
			15: "quadrillion",
			18: "quintillion",
			21: "sextillion",
			24: "septillion",
			27: "octillion",
			30: "nonillion",
			33: "decillion",
			36: "undecillion",
			39: "duodecillion",
			42: "tredecillion",
			45: "quattuordecillion",
			48: "quindecillion",
			51: "sexdecillion",
			54: "septendecillion",
			57: "octodecillion",
			60: "novemdecillion",
			63: "vigintillion",
		};

		// 2) Build a descending list of exponents we know about
		const powers = Object.keys(suffixes) // ["3","6",…,"100"]
			.map((k) => parseInt(k)) // [3,6,…,100]
			.sort((a, b) => b - a); // [100, 63, …, 3]

		// 3) Find the largest suffix we can apply
		for (const pow of powers) {
			if (this.exponent >= pow) {
				// shift mantissa so that we’re in [1, 1000)
				const scaled = this.mantissa * 10 ** (this.exponent - pow);
				return `${scaled.toFixed(decimalPlaces)} ${suffixes[pow]}`;
			}
		}

		// 4) If exponent < 3, it’s under a thousand—just print the full number
		if (this.exponent < 3) {
			const small = this.mantissa * 10 ** this.exponent;
			return small.toFixed(decimalPlaces);
		}

		// 5) Fallback: exponent was above your highest named suffix
		return `${this.mantissa.toFixed(decimalPlaces)}e${this.exponent}`;
	}
}

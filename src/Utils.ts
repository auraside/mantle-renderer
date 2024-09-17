export function average(...numbers: number[]) {
    let total = 0;
    for (let number of numbers) {
        total += number;
    }
    return total / numbers.length;
}

export function degreesToRadians(degrees: number) {
    return degrees / 180 * Math.PI;
}

export function radiansToDegrees(radians: number) {
    return radians / Math.PI * 180;
}

export function rotateArray<T>(array: T[], shift: number) {
	let original = [...array];

	for (let i = 0; i < array.length; ++i) {
		array[i] = original[(i + shift) % array.length];
	}

	return array;
}
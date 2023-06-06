import PlatformSpecifics from "./platformSpecifics/ServerPlatformUtils.js";

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

const platformSpecifics = new PlatformSpecifics();
export function platformUtils() {
    return platformSpecifics;
}
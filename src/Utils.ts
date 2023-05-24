export function stringToSkinUrl(string: string) {
    if (string.startsWith("./") || string.startsWith("../") || string.startsWith("/") || string.startsWith("http://") || string.startsWith("https://")) {
        return string;
    }
    return "https://api.cosmetica.cc/get/skin?user=" + string;
}

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
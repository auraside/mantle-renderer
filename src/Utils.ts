import { Coordinate } from "./interface/GenericModel.js";

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

export function rotate3d(point: Coordinate, pitch: number, roll: number, yaw: number): Coordinate {
    var cosa = Math.cos(yaw);
    var sina = Math.sin(yaw);

    var cosb = Math.cos(pitch);
    var sinb = Math.sin(pitch);

    var cosc = Math.cos(roll);
    var sinc = Math.sin(roll);

    var Axx = cosa * cosb;
    var Axy = cosa * sinb * sinc - sina * cosc;
    var Axz = cosa * sinb * cosc + sina * sinc;

    var Ayx = sina * cosb;
    var Ayy = sina * sinb * sinc + cosa * cosc;
    var Ayz = sina * sinb * cosc - cosa * sinc;

    var Azx = -sinb;
    var Azy = cosb * sinc;
    var Azz = cosb * cosc;

    const [px, py, pz] = point;

    return [
        Axx * px + Axy * py + Axz * pz,
        Ayx * px + Ayy * py + Ayz * pz,
        Azx * px + Azy * py + Azz * pz
    ];
}
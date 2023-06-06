import { Texture } from "three"

export interface Canvas3d { // the bare minimum to count as a canvas
    width: number
    height: number
    offsetWidth: number
    offsetHeight: number
    getContext: (...params: any) => any
    addEventListener: (...params: any) => any
    removeEventListener: (...params: any) => any
}

export interface Canvas2d {
    width: number
    height: number
}

export enum Platform {
    SERVER = "Server",
    CLIENT = "Client"
}

export default abstract class BasePlatformUtils {
    abstract getPlatform(): Platform

    abstract create3dCanvas(width: number, height: number): Canvas3d

    abstract create2dCanvas(width: number, height: number): Canvas2d

    abstract getDevicePixelRatio(): number

    abstract createTexture(url: string): Promise<Texture>
}
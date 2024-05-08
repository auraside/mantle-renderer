import { PlayerModelOptions } from "../Index.js"
import { Canvas3d, BasePlatformUtils } from "../platformSpecifics/BasePlatformUtils.js"
import { LightOptions } from "./LightOptions.js"

export interface RendererBloomOptions {
    threshold: number // how bright something has to be to start to bloom
    strength: number // intensity of bloom
    radius: number // spread of bloom
}

export interface RendererOptions {
    live: boolean
    platformUtils: BasePlatformUtils
    
    canvas?: HTMLCanvasElement | Canvas3d
    fov?: number // field of view of camera. defaults to 70 (degrees)
    antialias?: boolean // simple antialiasing
    alpha?: boolean // transparent background

    ambientLight?: LightOptions // evenly illuminate entire scene

    player?: PlayerModelOptions // omit to have no player in scene

    fxaa?: boolean // better but more expensive antialiasing
    ssaa?: boolean // most expensive antialiasing (due to supersampling). causes goofy colour banding for now
    bloom?: RendererBloomOptions
    shadows?: boolean // expensive

    controls?: boolean // mouse pointer controls

}
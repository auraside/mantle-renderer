import LightOptions from "./LightOptions.js"

export default interface RendererOptions {
    canvas: HTMLCanvasElement
    fov?: number // field of view of camera. defaults to 70 (degrees)
    antialias?: boolean // enable antialiasing for canvas
    ambientLight?: LightOptions
}
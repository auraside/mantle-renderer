import type { Canvas } from "canvas";
import { Group, Material, Mesh, Texture } from "three";

export interface ModelInfoTexture {
    material: Material
    texture: Texture | null
    canvas: HTMLCanvasElement | Canvas | null
}

export interface ModelInfo {
    textures: Record<string, ModelInfoTexture>
    mesh: Group | Mesh
}
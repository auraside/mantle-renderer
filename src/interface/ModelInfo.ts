import { Group, Material, Mesh, Texture } from "three";

export interface ModelInfo {
    textures: Texture[]
    materials: Material[]
    mesh: Group | Mesh
}
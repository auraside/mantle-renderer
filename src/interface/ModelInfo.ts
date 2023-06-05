import { Group, Material, Mesh, Texture } from "three";

export default interface ModelInfo {
    textures: Texture[]
    materials: Material[]
    mesh: Group | Mesh
}
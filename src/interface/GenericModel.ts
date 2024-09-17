import { ModelPartId } from "../model/ModelPart.js";

export interface GenericModelTexture {
    name: string
    url: string | null
    width: number
    height: number
}

export type Coordinate = [number, number, number];

export interface GenericModelFaceUv {
    texture: string
    rotation: number
    uv: [number, number, number, number]
}

export type GenericModelFace = "top" | "bottom" | "left" | "right" | "front" | "back"

export interface GenericModelElementUvs {
    top: GenericModelFaceUv
    bottom: GenericModelFaceUv
    left: GenericModelFaceUv
    right: GenericModelFaceUv
    front: GenericModelFaceUv
    back: GenericModelFaceUv
}

export interface GenericModelElement {
    position: Coordinate
    size: Coordinate
    
    rotation: Coordinate
    origin: Coordinate
    uv: GenericModelElementUvs
}

export interface GenericModel {
    attachTo?: ModelPartId
    offset?: Coordinate

    textures: GenericModelTexture[]
    elements: GenericModelElement[]
}
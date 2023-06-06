import ModelPart from "../model/ModelPart.js";

export interface GenericModelTexture {
    name: string
    url: string
    width: number
    height: number
}

export type Coordinate = [number, number, number];

export interface GenericModelFaceUv {
    texture: string
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

export default interface GenericModel {
    attachTo?: ModelPart
    offset?: Coordinate

    textures: GenericModelTexture[]
    elements: GenericModelElement[]
}
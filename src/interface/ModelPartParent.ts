import { ModelPart } from "../model/ModelPart.js";

export interface ModelPartParent {
    part: ModelPart

    xOffset?: number
    yOffset?: number
    zOffset?: number

    xAttachment?: number
    yAttachment?: number
    zAttachment?: number
}
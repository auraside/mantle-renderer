import { Coordinate, GenericModel, GenericModelElement, GenericModelFaceUv, GenericModelTexture, ModelPart, average, degreesToRadians } from "../Index.js";

export function parseJavaBlockItem(json: any, textureUrl: string, offset?: Coordinate, attachTo?: ModelPart) {
    const texture: GenericModelTexture = {
        name: Object.keys(json.textures)[0],
        url: textureUrl,
        width: 16,
        height: 16
    };

    const elements: GenericModelElement[] = [];
    for (let jsonElement of json.elements) {
        const position: Coordinate = [
            average(jsonElement.from[0], jsonElement.to[0]),
            average(jsonElement.from[1], jsonElement.to[1]),
            average(jsonElement.from[2], jsonElement.to[2])
        ]

        const size: Coordinate = [
            Math.abs(jsonElement.from[0] - jsonElement.to[0]),
            Math.abs(jsonElement.from[1] - jsonElement.to[1]),
            Math.abs(jsonElement.from[2] - jsonElement.to[2])
        ]

        const rotation: Coordinate = [0, 0, 0];
        const origin: Coordinate = [0, 0, 0];
        if (jsonElement.rotation) {
            origin.splice(0, 3, ...jsonElement.rotation.origin);
            const rotationIndex = ["x", "y", "z"].indexOf(jsonElement.rotation.axis.toLowerCase());
            rotation[rotationIndex] = degreesToRadians(jsonElement.rotation.angle);
        }

        function getUv(face: any): GenericModelFaceUv {
            face = jsonElement.faces[face];
            
            let texture: string = face.texture;
            if (texture.startsWith("#") && !isNaN(parseInt(texture.substring(1)))) {
                texture = texture.substring(1);
            }

            return {
                texture,
                uv: face.uv
            }
        }
        
        const element: GenericModelElement = {
            position,
            size,
            rotation,
            origin,
            uv: {
                top: getUv("up"),
                bottom: getUv("down"),
                left: getUv("east"),
                right: getUv("west"),
                front: getUv("north"),
                back: getUv("south")
            }
        }

        elements.push(element);
    }

    const model: GenericModel = {
        attachTo,
        offset,
        textures: [texture],
        elements
    }

    return model;
}
import { BufferAttribute, BufferGeometry, Group, Material, Mesh, Texture, Vector2 } from "three";
import GenericModel, { Coordinate, GenericModelElement, GenericModelFaceUv, GenericModelTexture } from "./interface/GenericModel.js"
import { average, degreesToRadians } from "./Utils.js";
import ModelPart from "./model/ModelPart.js";

export function getFaceVertices(x1: number, y1: number, x2: number, y2: number, textureWidth: number, textureHeight: number) {
    return [
        new Vector2(x1 / textureWidth, 1.0 - y2 / textureHeight),
		new Vector2(x2 / textureWidth, 1.0 - y2 / textureHeight),
		new Vector2(x2 / textureWidth, 1.0 - y1 / textureHeight),
		new Vector2(x1 / textureWidth, 1.0 - y1 / textureHeight)
    ];
}

export function orderUvs(top: Vector2[], bottom: Vector2[], left: Vector2[], right: Vector2[], front: Vector2[], back: Vector2[]) {
    return [
		left[3], left[2], left[0], left[1],
        right[3], right[2], right[0], right[1],
		top[0], top[1], top[3], top[2],
		bottom[3], bottom[2], bottom[0], bottom[1],
		back[3], back[2], back[0], back[1],
        front[3], front[2], front[0], front[1]
    ];
}

export function getBoxUVs(u: number, v: number, width: number, height: number, depth: number, textureWidth: number, textureHeight: number) {
    const top = getFaceVertices(u + depth, v, u + width + depth, v + depth, textureWidth, textureHeight);
	const bottom = getFaceVertices(u + width + depth, v, u + width * 2 + depth, v + depth, textureWidth, textureHeight);
	const left = getFaceVertices(u, v + depth, u + depth, v + depth + height, textureWidth, textureHeight);
	const front = getFaceVertices(u + depth, v + depth, u + width + depth, v + depth + height, textureWidth, textureHeight);
	const right = getFaceVertices(u + width + depth, v + depth, u + width + depth * 2, v + height + depth, textureWidth, textureHeight);
	const back = getFaceVertices(u + width + depth * 2, v + depth, u + width * 2 + depth * 2, v + height + depth, textureWidth, textureHeight);

    return orderUvs(top, bottom, left, right, front, back);
}

export function convertVector2ToArray(vectors: Vector2[]) {
    const array = new Float32Array(vectors.length * 2);
    for (let i = 0; i < vectors.length; i++) {
        const vector = vectors[i];
        array[i * 2] = vector.x;
        array[i * 2 + 1] = vector.y;
    }
    return array;
}

export function setUvs(geometry: BufferGeometry, uvs: Vector2[]) {
    const array = convertVector2ToArray(uvs);

    const uvAttr = geometry.attributes.uv as BufferAttribute;
    const anyAttr = uvAttr as any;
    anyAttr.array = array;
    uvAttr.needsUpdate = true;
}

export function updateMaterialTexture(material: Material, texture: Texture, disposeOldTexture: boolean) {
    const anyMaterial = material as any;

    if (disposeOldTexture) {
        const oldTexture = anyMaterial.map as Texture;
        oldTexture.dispose();
    }
    
    anyMaterial.map = texture;
    material.needsUpdate = true;
}

export function parseJavaBlockModel(json: any, textureUrl: string, attachTo: ModelPart, offset: Coordinate) {
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


// Disposes of geometry, meshes & groups. Materials & textures still need to be manually disposed of.
export function disposeOfGroup(object: Mesh | Group) {
    object.traverse(child => {
        if (child instanceof Mesh) {
            const geometry: BufferGeometry = child.geometry;
            if (geometry) {
                geometry.dispose();
            }
        }
    });
}
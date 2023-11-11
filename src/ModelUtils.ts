import { BoxGeometry, BufferAttribute, BufferGeometry, DoubleSide, Group, Material, Mesh, MeshLambertMaterial, NearestFilter, SRGBColorSpace, Texture, Vector2 } from "three";
import GenericModel, { Coordinate, GenericModelElement, GenericModelFace, GenericModelFaceUv, GenericModelTexture } from "./interface/GenericModel.js"
import { average, degreesToRadians } from "./Utils.js";
import ModelPart from "./model/ModelPart.js";
import ModelInfo from "./interface/ModelInfo.js";
import BasePlatformUtils from "./platformSpecifics/BasePlatformUtils.js";
import { Canvas } from "canvas";

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

export function parseJavaBlockModel(json: any, textureUrl: string, offset?: Coordinate, attachTo?: ModelPart) {
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


export async function buildModel(model: GenericModel, platformUtils: BasePlatformUtils, srgb?: boolean) {
    const group = new Group();

    const outModel: ModelInfo = {
        textures: Array(model.textures.length),
        materials: Array(model.textures.length),
        mesh: group
    }

    const textures: {
        [key: string]: {
            name: string,
            url: string,
            width: number,
            height: number,
            material: Material
        }
    } = {};

    const faceOrder: GenericModelFace[] = ["top", "bottom", "left", "right", "back", "front"]; // todo: order this to properly support multiple textures

    const promises: Promise<void>[] = [];

    for (let i = 0; i < model.textures.length; i++) {
        const textureData = model.textures[i];

        const promise = new Promise<void>(async resolve => {
            const texture = await platformUtils.createTexture(textureData.url);
            texture.magFilter = NearestFilter;
            texture.minFilter = NearestFilter;
            if (srgb) {
                texture.colorSpace = SRGBColorSpace;
            }
            outModel.textures[i] = texture;
    
            const material = new MeshLambertMaterial({
                map: texture,
                side: DoubleSide,
                transparent: true,
                alphaTest: 1e-5
            });
            outModel.materials[i] = material;
    
            textures[textureData.name] = {
                ...textureData,
                material
            };

            resolve();
        });
        promises.push(promise);
    }

    await Promise.allSettled(promises);

    for (let element of model.elements) {
        const geometry = new BoxGeometry(...element.size);
        const uvs: Map<GenericModelFace, Vector2[]> = new Map();

        for (let i = 0; i < 6; i++) {
            const uv = element.uv[faceOrder[i]];
            const materialIndex = Object.keys(textures).indexOf(uv.texture);
            const textureInfo = textures[uv.texture];
            geometry.groups[i].materialIndex = materialIndex;
            const vertices = getFaceVertices(uv.uv[0], uv.uv[1], uv.uv[2], uv.uv[3], textureInfo.width, textureInfo.height);
            uvs.set(faceOrder[i], vertices);
        }
        
        setUvs(geometry, orderUvs(uvs.get("top")!, uvs.get("bottom")!, uvs.get("left")!, uvs.get("right")!, uvs.get("front")!, uvs.get("back")!));

        const part = new ModelPart(
            geometry,
            Object.values(textures).map(info => info.material)
        );
        part.pivot.position.set(...element.origin);
        part.mesh.position.set(
            element.position[0] - element.origin[0],
            element.position[1] - element.origin[1],
            element.position[2] - element.origin[2]
        );
        part.pivot.rotation.set(...element.rotation);

        group.add(part.pivot);
    }

    if (model.offset) {
        group.position.set(...model.offset);
    }

    const container = new Group();
    container.add(group);

    return {
        modelInfo: outModel,
        mesh: container
    }
}


export async function formatSkin(skin: string | Canvas | HTMLCanvasElement, platformUtils: BasePlatformUtils) {
    if (typeof skin == "string") {
        skin = await platformUtils.urlToCanvas(skin);
    }
    const frequently = {
        willReadFrequently: true
    } as any;

    const inCtx = skin.getContext("2d", frequently)! as CanvasRenderingContext2D;

    const screenData = inCtx.getImageData(0, 0, skin.width, skin.height);
    for (let i = 3; i < screenData.data.length; i += 4) {
        screenData.data[i] = 255;
    }
    const solidCanvas = platformUtils.create2dCanvas(skin.width, skin.height) as Canvas | HTMLCanvasElement;
    const solidCtx = solidCanvas.getContext("2d", frequently)! as CanvasRenderingContext2D;
    solidCtx.putImageData(screenData, 0, 0);

    const canvas = platformUtils.create2dCanvas(64, 64) as Canvas | HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#000000";
    ctx.fillRect(8, 0, 16, 8); // top of head
    ctx.fillRect(0, 8, 32, 8); // rest of head

    ctx.fillRect(20, 48, 8, 4); // top of left leg
    ctx.fillRect(36, 48, 8, 4); // top of left arm
    ctx.fillRect(16, 52, 32, 12); // rest of left leg and left arm

    ctx.fillRect(4, 16, 8, 4); // top of right leg
    ctx.fillRect(20, 16, 16, 4); // top of body
    ctx.fillRect(44, 16, 8, 4); // top of right arm
    ctx.fillRect(0, 20, 56, 12); // rest of body and right arm


    ctx.putImageData(solidCtx.getImageData(8, 0, 16, 8), 8, 0); // top and bottom of head
    ctx.putImageData(solidCtx.getImageData(0, 8, 32, 8), 0, 8); // rest of head

    ctx.putImageData(solidCtx.getImageData(4, 16, 8, 4), 4, 16); // top of right leg
    ctx.putImageData(solidCtx.getImageData(20, 16, 16, 4), 20, 16); // top of body
    ctx.putImageData(solidCtx.getImageData(44, 16, 8, 4), 44, 16); // top of right arm
    ctx.putImageData(solidCtx.getImageData(0, 20, 56, 12), 0, 20); // rest of right leg, body and right arm


    if (skin.height == 32) {
        ctx.putImageData(solidCtx.getImageData(4, 16, 8, 4), 20, 48); // top of left leg
        ctx.putImageData(solidCtx.getImageData(0, 20, 16, 12), 16, 52); // rest of left leg

        ctx.putImageData(solidCtx.getImageData(44, 16, 8, 4), 36, 48); // top of left arm
        ctx.putImageData(solidCtx.getImageData(40, 20, 16, 12), 32, 52); // rest of left arm
    } else {
        ctx.putImageData(solidCtx.getImageData(20, 48, 8, 4), 20, 48); // top of left leg
        ctx.putImageData(solidCtx.getImageData(36, 48, 8, 4), 36, 48); // top of left arm
        ctx.putImageData(solidCtx.getImageData(16, 52, 32, 12), 16, 52); // rest of left leg and left arm

        ctx.putImageData(inCtx.getImageData(40, 0, 16, 8), 40, 0); // top and bottom of hat
        ctx.putImageData(inCtx.getImageData(32, 8, 32, 8), 32, 8); // rest of hat

        ctx.putImageData(inCtx.getImageData(4, 32, 8, 4), 4, 32); // top of right trouser
        ctx.putImageData(inCtx.getImageData(20, 32, 16, 4), 20, 32); // top of jacket
        ctx.putImageData(inCtx.getImageData(44, 32, 8, 4), 44, 32); // top of right sleeve
        ctx.putImageData(inCtx.getImageData(0, 36, 56, 12), 0, 36); // rest of right trouser, jacket and right sleeve
        
        ctx.putImageData(inCtx.getImageData(4, 48, 8, 4), 4, 48); // top of left trouser
        ctx.putImageData(inCtx.getImageData(0, 52, 16, 12), 0, 52); // rest of left trouser

        ctx.putImageData(inCtx.getImageData(52, 48, 8, 4), 52, 48); // top of left sleeve
        ctx.putImageData(inCtx.getImageData(48, 52, 16, 12), 48, 52); // rest of left sleeve
    }

    return canvas;
}
import { BufferAttribute, BufferGeometry, Material, Texture, Vector2 } from "three";

export function getFaceVertices(x1: number, y1: number, x2: number, y2: number, textureWidth: number, textureHeight: number) {
    return [
        new Vector2(x1 / textureWidth, 1.0 - y2 / textureHeight),
		new Vector2(x2 / textureWidth, 1.0 - y2 / textureHeight),
		new Vector2(x2 / textureWidth, 1.0 - y1 / textureHeight),
		new Vector2(x1 / textureWidth, 1.0 - y1 / textureHeight)
    ];
}

export function getBoxUVs(u: number, v: number, width: number, height: number, depth: number, textureWidth: number, textureHeight: number) {
    const top = getFaceVertices(u + depth, v, u + width + depth, v + depth, textureWidth, textureHeight);
	const bottom = getFaceVertices(u + width + depth, v, u + width * 2 + depth, v + depth, textureWidth, textureHeight);
	const left = getFaceVertices(u, v + depth, u + depth, v + depth + height, textureWidth, textureHeight);
	const front = getFaceVertices(u + depth, v + depth, u + width + depth, v + depth + height, textureWidth, textureHeight);
	const right = getFaceVertices(u + width + depth, v + depth, u + width + depth * 2, v + height + depth, textureWidth, textureHeight);
	const back = getFaceVertices(u + width + depth * 2, v + depth, u + width * 2 + depth * 2, v + height + depth, textureWidth, textureHeight);

    return [
        right[3], right[2], right[0], right[1],
		left[3], left[2], left[0], left[1],
		top[3], top[2], top[0], top[1],
		bottom[0], bottom[1], bottom[3], bottom[2],
		front[3], front[2], front[0], front[1],
		back[3], back[2], back[0], back[1]
    ];
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
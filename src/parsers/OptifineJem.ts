import { Coordinate, GenericModel, GenericModelElement, rotate3d, degreesToRadians } from "../Index.js";

type OptifineModel = {
    type: string; // should be "PlayerItem" for cosmetics
    textureSize: [
        number,
        number
    ];
    models: OptifineBone[];
}

type AxisInversion = "" | "x" | "y" | "z" | "xy" | "xz" | "yz" | "xyz";

type OptifineBone = {
    id: string; // should be "Main" for the root bone
    type: "ModelBox"; // idk what the other ones are
    attachTo: "head" | "body" | "leftArm" | "rightArm" | "leftLeg" | "rightLeg";
    invertAxis?: AxisInversion; // other options like "zyx" are technically possible but aren't recommended cos they're ugly. TODO: use this value
    translate?: Coordinate;
    rotate?: Coordinate;
    mirrorTexture?: "" | "u" | "v" | "uv"; // TODO: use this value
    submodels?: OptifineBone[];
    boxes?: OptifineBox[];
}

type UV = [number, number, number, number];

type BoxUvOptifineBox = {
    coordinates: [
        number, number, number,
        number, number, number
    ];
    textureOffset: [number, number];
};
type CustomUvOptifineBox = {
    coordinates: [
        number, number, number,
        number, number, number
    ];
    uvNorth?: UV;
    uvSouth?: UV;
    uvEast?: UV;
    uvWest?: UV;
    uvUp?: UV;
    uvDown?: UV;
}

type OptifineBox = BoxUvOptifineBox | CustomUvOptifineBox;

function usesBoxUvs(optifineBox: OptifineBox): optifineBox is BoxUvOptifineBox {
    return optifineBox.hasOwnProperty("textureOffset");
}

type BoneContainer = {
    bones: OptifineBone[];
    worldOrigin: Coordinate;
    worldRotation: Coordinate;
}

type GenericUv = "front" | "back" | "right" | "left" | "top" | "bottom";
type OptifineUv = "uvNorth" | "uvSouth" | "uvEast" | "uvWest" | "uvUp" | "uvDown";

const UV_SIDES: Record<GenericUv, OptifineUv> = {
    front: "uvNorth",
    back: "uvSouth",
    right: "uvEast",
    left: "uvWest",
    top: "uvUp",
    bottom: "uvDown"
} as const;

export function parseOptifineJem(jem: OptifineModel, texture: string): GenericModel {
    const bones: BoneContainer[] = jem.models.map(bone => ({
        bones: [bone],
        worldOrigin: [0, 0, 0],
        worldRotation: [0, 0, 0]
    }));

    const elements: GenericModelElement[] = [];

    for (let boneTree of bones) {
        const parentBone = boneTree.bones[boneTree.bones.length - 1];

        const parentSpaceOrigin = rotate3d(parentBone.translate || [0, 0, 0], ...boneTree.worldRotation.map(degreesToRadians) as Coordinate);
        const worldOrigin = [
            parentSpaceOrigin[0] + boneTree.worldOrigin[0],
            parentSpaceOrigin[1] + boneTree.worldOrigin[1],
            parentSpaceOrigin[2] + boneTree.worldOrigin[2]
        ] as Coordinate;

        const totalRotation: Coordinate = [0, 0, 0];
        for (let bone of boneTree.bones) {
            for (let i = 0; i < 3; i++) {
                totalRotation[i] += bone.rotate?.[i] ?? 0;
            }
        }

        if (parentBone.submodels) {
            bones.push(...parentBone.submodels.map(bone => ({
                bones: [...boneTree.bones, bone],
                worldOrigin: worldOrigin,
                worldRotation: totalRotation
            })));
        }

        if (parentBone.boxes?.length) {
            let invertAxis: AxisInversion | undefined;
            for (let i = boneTree.bones.length - 1; i >= 0; i--) {
                if (boneTree.bones[i].invertAxis !== undefined) {
                    invertAxis = boneTree.bones[i].invertAxis!;
                    break;
                }
            }
            if (invertAxis === undefined) {
                invertAxis = "";
            }

            for (let box of parentBone.boxes) {
                const size = box.coordinates.slice(3) as Coordinate;
                const position = box.coordinates.slice(0, 3) as Coordinate;
                for (let i = 0; i < 3; i++) {
                    position[i] += worldOrigin[i] + size[i] / 2;
                }

                const element: GenericModelElement = {
                    size,
                    position,
                    rotation: totalRotation.map(degreesToRadians) as Coordinate,
                    origin: worldOrigin,
                    uv: {}
                };

                if (usesBoxUvs(box)) {
                    element.uv.top = {
                        texture: "#0",
                        uv: [
                            box.textureOffset[0] + size[2],
                            box.textureOffset[1],
                            box.textureOffset[0] + size[0] + size[2],
                            box.textureOffset[1] + size[2]
                        ]
                    };
                    element.uv.bottom = {
                        texture: "#0",
                        uv: [
                            box.textureOffset[0] + size[0] + size[2],
                            box.textureOffset[1],
                            box.textureOffset[0] + size[0] * 2 + size[2],
                            box.textureOffset[1] + size[2]
                        ]
                    };
                    element.uv.left = {
                        texture: "#0",
                        uv: [
                            box.textureOffset[0],
                            box.textureOffset[1] + size[2],
                            box.textureOffset[0] + size[2],
                            box.textureOffset[1] + size[1] + size[2]
                        ]
                    };
                    element.uv.right = {
                        texture: "#0",
                        uv: [
                            box.textureOffset[0] + size[0] + size[2],
                            box.textureOffset[1] + size[2],
                            box.textureOffset[0] + size[0] + size[2] * 2,
                            box.textureOffset[1] + size[1] + size[2]
                        ]
                    };
                    element.uv.front = {
                        texture: "#0",
                        uv: [
                            box.textureOffset[0] + size[2],
                            box.textureOffset[1] + size[2],
                            box.textureOffset[0] + size[0] + size[2],
                            box.textureOffset[1] + size[1] + size[2]
                        ]
                    };
                    element.uv.back = {
                        texture: "#0",
                        uv: [
                            box.textureOffset[0] + size[0] + size[2] * 2,
                            box.textureOffset[1] + size[2],
                            box.textureOffset[0] + (size[0] + size[2]) * 2,
                            box.textureOffset[1] + size[1] + size[2]
                        ]
                    };
                } else {
                    for (let [key, value] of Object.entries(UV_SIDES)) {
                        if (box[value]) {
                            element.uv[key as GenericUv] = {
                                texture: "#0",
                                uv: box[value]!
                            };
                        }
                    }
                }
                elements.push(element);
            }
        }
    }

    return {
        textures: [{
            name: "#0",
            url: texture,
            width: jem.textureSize[0],
            height: jem.textureSize[1]
        }],
        elements
    }
}
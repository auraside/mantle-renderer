import { BoxGeometry, DoubleSide, FrontSide, Group, LinearFilter, Material, MeshLambertMaterial, NearestFilter, Object3D, SRGBColorSpace, Texture } from "three";
import { ModelPart, ModelPartId } from "./ModelPart.js";
import { buildModel, disposeOfGroup, formatSkin, getBoxUVs, setUvs, updateMaterialTexture } from "../ModelUtils.js";
import { MantleRenderer } from "../MantleRenderer.js";
import { DisposableObject } from "../interface/DisposableObject.js";
import { ModelInfo } from "../interface/ModelInfo.js";
import { GenericModel } from "../interface/GenericModel.js";
import { ElytraModel, ElytraModelOptions } from "./ElytraModel.js";
import { CloakModel, CloakModelOptions } from "./CloakModel.js";

export interface PlayerModelOptions {
    skin?: string // path, url, username or uuid
    slim?: boolean // steve or alex model
    castShadow?: boolean // player model casts shadow
    receiveShadow?: boolean // player model receives shadow
    onSkinLoad?: () => void // callback for initial skin loading
    elytra?: ElytraModelOptions // elytra options
    cloak?: CloakModelOptions // cloak options
}

export class PlayerModel {
    private readonly group = new Group();
    private readonly modelParts: Map<string, ModelPart> = new Map();
    private skinTexture: Texture | undefined;
    private readonly skinMaterial: Material;
    private readonly transparentSkinMaterial: Material;
    private readonly models: ModelInfo[] = [];
    private elytra: ElytraModel;
    private cloak: CloakModel;
    private onSkinLoad: (() => void) | null = null;
    private castShadow: boolean;
    private receiveShadow: boolean;

    private disposableObjects: DisposableObject[] = [];

    public constructor(private readonly renderer: MantleRenderer, options: PlayerModelOptions) {
        this.castShadow = options.castShadow ?? false;
        this.receiveShadow = options.receiveShadow ?? false;

        this.skinMaterial = new MeshLambertMaterial({
            side: FrontSide
        });
        this.disposableObjects.push(this.skinMaterial);
        this.transparentSkinMaterial = new MeshLambertMaterial({
            side: DoubleSide,
            transparent: true,
            alphaTest: 1e-5
        });
        this.disposableObjects.push(this.transparentSkinMaterial);

        this.onSkinLoad = options.onSkinLoad || null;
        this.setSkin(options.skin || "https://textures.minecraft.net/texture/31f477eb1a7beee631c2ca64d06f8f68fa93a3386d04452ab27f43acdf1b60cb").then(this.onSkinLoad); // default steve skin

        // body & jacket
        const bodyGeometry = new BoxGeometry(8, 12, 4);
        setUvs(bodyGeometry, getBoxUVs(16, 16, 8, 12, 4, 64, 64));
        this.modelParts.set("body", new ModelPart(
            bodyGeometry,
            this.skinMaterial
        ));
        const body = this.getBodyPart("body")!;
        const jacketGeometry = new BoxGeometry(8.5, 12.5, 4.5);
        setUvs(jacketGeometry, getBoxUVs(16, 32, 8, 12, 4, 64, 64));
        this.modelParts.set("jacket", new ModelPart(
            jacketGeometry,
            this.transparentSkinMaterial,
            {
                part: body
            }
        ));


        // head & hat
        const headGeometry = new BoxGeometry(8, 8, 8);
        setUvs(headGeometry, getBoxUVs(0, 0, 8, 8, 8, 64, 64));
        this.modelParts.set("head", new ModelPart(
            headGeometry,
            this.skinMaterial,
            {
                part: body,
                yOffset: 10,
                yAttachment: -4
            }
        ));
        const hatGeometry = new BoxGeometry(9, 9, 9);
        setUvs(hatGeometry, getBoxUVs(32, 0, 8, 8, 8, 64, 64));
        this.modelParts.set("hat", new ModelPart(
            hatGeometry,
            this.transparentSkinMaterial,
            {
                part: this.getBodyPart("head")
            }
        ));

        
        // right arm & sleeve
        this.modelParts.set("armRight", new ModelPart(
            new BoxGeometry(1, 1, 1),
            this.skinMaterial,
            {
                part: body,
                yAttachment: 4
            }
        ));
        this.modelParts.set("sleeveRight", new ModelPart(
            new BoxGeometry(1, 1, 1),
            this.transparentSkinMaterial,
            {
                part: this.getBodyPart("armRight")
            }
        ));
        

        // left arm & sleeve
        this.modelParts.set("armLeft", new ModelPart(
            new BoxGeometry(1, 1, 1),
            this.skinMaterial,
            {
                part: body,
                yAttachment: 4
            }
        ));
        this.modelParts.set("sleeveLeft", new ModelPart(
            new BoxGeometry(1, 1, 1),
            this.transparentSkinMaterial,
            {
                part: this.getBodyPart("armLeft")
            }
        ));


        // right leg & trouser
        const legLeftGeometry = new BoxGeometry(4, 12, 4);
        setUvs(legLeftGeometry, getBoxUVs(16, 48, 4, 12, 4, 64, 64));
        this.modelParts.set("legRight", new ModelPart(
            legLeftGeometry,
            this.skinMaterial,
            {
                part: body,
                yOffset: -12,
                xOffset: 1.99, // just <2 to prevent z-fighting
                yAttachment: 6
            }
        ));
        const trouserLeftGeometry = new BoxGeometry(4.5, 12.5, 4.5);
        setUvs(trouserLeftGeometry, getBoxUVs(0, 48, 4, 12, 4, 64, 64));
        this.modelParts.set("trouserRight", new ModelPart(
            trouserLeftGeometry,
            this.transparentSkinMaterial,
            {
                part: this.getBodyPart("legRight")
            }
        ));


        // left leg & trouser
        const legRightGeometry = new BoxGeometry(4, 12, 4);
        setUvs(legRightGeometry, getBoxUVs(0, 16, 4, 12, 4, 64, 64));
        this.modelParts.set("legLeft", new ModelPart(
            legRightGeometry,
            this.skinMaterial,
            {
                part: body,
                yOffset: -12,
                xOffset: -1.99, // just >-2 to prevent z-fighting
                yAttachment: 6
            }
        ));
        const trouserRightGeometry = new BoxGeometry(4.5, 12.5, 4.5);
        setUvs(trouserRightGeometry, getBoxUVs(0, 32, 4, 12, 4, 64, 64));
        this.modelParts.set("trouserLeft", new ModelPart(
            trouserRightGeometry,
            this.transparentSkinMaterial,
            {
                part: this.getBodyPart("legLeft")
            }
        ));

        this.elytra = new ElytraModel(renderer.platformUtils, options.elytra);
        const elytra = this.elytra.getMesh();
        elytra.position.set(0, 6, 3);
        this.getBodyPart("body").mesh.add(elytra);

        this.cloak = new CloakModel(renderer.platformUtils, options.cloak);
        const cloak = this.cloak.getMesh();
        cloak.position.set(0, 6, 2);
        this.getBodyPart("body").mesh.add(cloak);




        this.setSlim(!!options.slim);

        this.group.add(body.pivot);
        this.group.name = "Root";

        this.group.traverse(child => {
            child.castShadow = this.castShadow;
            child.receiveShadow = this.receiveShadow;
            if (child.type == "Group" || child.type == "Mesh") {
                const add = child.add.bind(child);
                child.add = (...objects: Object3D<Event>[]) => {
                    const response = add(...objects);
                    for (const object of objects) {
                        console.log("Object added detected");
                        object.traverse(grandchild => {
                            grandchild.castShadow = this.castShadow;
                            grandchild.receiveShadow = this.receiveShadow;
                        });
                    }
                    return response;
                }
            }
        });

        this.castShadow = options.castShadow ?? false;
        this.receiveShadow = options.receiveShadow ?? false;
    }

    public setShadowOptions(cast: boolean, receive: boolean) {
        this.castShadow = cast;
        this.receiveShadow = receive;

        this.group.traverse(child => {
            child.castShadow = cast;
            child.receiveShadow = receive;
        });
    }

    public getShadowOptions() {
        return {
            cast: this.castShadow,
            receive: this.receiveShadow
        }
    }

    public getMesh() {
        return this.group;
    }

    public getBodyPart(name: ModelPartId): ModelPart {
        return this.modelParts.get(name) as ModelPart;
    }

    public setSlim(slim: boolean) {
        const armWidth = slim ? 3 : 4;

        const armRight = this.modelParts.get("armRight")!;
        armRight.mesh.scale.set(armWidth, 12, 4);
        setUvs(armRight.geometry, getBoxUVs(40, 16, armWidth, 12, 4, 64, 64));
        armRight.pivot.position.setX(slim ? 5.5 : 6);

        const sleeveRight = this.modelParts.get("sleeveRight")!;
        sleeveRight.mesh.scale.set((armWidth + 0.5) / armWidth, 12.5 / 12, 5 / 4);
        setUvs(sleeveRight.geometry, getBoxUVs(40, 32, armWidth, 12, 4, 64, 64));


        const armLeft = this.modelParts.get("armLeft")!;
        armLeft.mesh.scale.set(armWidth, 12, 4);
        setUvs(armLeft.geometry, getBoxUVs(32, 48, armWidth, 12, 4, 64, 64));
        armLeft.pivot.position.setX(slim ? -5.5 : -6);

        const sleeveLeft = this.modelParts.get("sleeveLeft")!;
        sleeveLeft.mesh.scale.set((armWidth + 0.5) / armWidth, 12.5 / 12, 5 / 4);
        setUvs(sleeveLeft.geometry, getBoxUVs(48, 48, armWidth, 12, 4, 64, 64));
    }

    public async setSkin(skin: string) {
        if (this.skinTexture) {
            const index = this.disposableObjects.indexOf(this.skinTexture);
            if (index >= 0) this.disposableObjects.splice(index, 1);

            this.skinTexture.dispose();
        }

        const canvas = await formatSkin(skin, this.renderer.platformUtils);

        this.skinTexture = await this.renderer.platformUtils.createTexture(canvas);
        this.skinTexture.magFilter = NearestFilter;
        this.skinTexture.minFilter = LinearFilter;
        this.skinTexture.colorSpace = SRGBColorSpace;
        this.disposableObjects.push(this.skinTexture);

        updateMaterialTexture(this.skinMaterial, this.skinTexture, false);
        updateMaterialTexture(this.transparentSkinMaterial, this.skinTexture, false);
    }

    public async addModel(model: GenericModel, srgb?: boolean) {
        if (!model.attachTo) throw "Model doesn't have an attachment specified";
        const { modelInfo, mesh } = await buildModel(model, this.renderer.platformUtils, srgb);
        mesh.scale.set(1.001, 1.001, 1.001);
        model.attachTo.pivot.add(mesh);
        this.disposableObjects.push(...modelInfo.materials, ...modelInfo.textures);

        this.models.push(modelInfo);
        return modelInfo;
    }

    public removeModel(model: ModelInfo) {
        const index = this.models.indexOf(model);
        if (index < 0) throw "Model is not loaded to this player";
        this.models.splice(index, 1);

        const disposables = [...model.materials, ...model.textures];
        for (let object of disposables) {
            const index = this.disposableObjects.indexOf(object);
            if (index >= 0) this.disposableObjects.splice(index, 1);
            object.dispose();
        }
        model.mesh.parent?.remove(model.mesh);
        disposeOfGroup(model.mesh);
    }

    public dispose() {
        while (this.models.length) {
            const model = this.models[0];
            this.removeModel(model);
            this.models.shift();
        }

        for (let object of this.disposableObjects) {
            object.dispose();
        }

        for (let part of this.modelParts.values()) {
            disposeOfGroup(part.pivot);
        }
    }

    public getModels() {
        return [...this.models];
    }

    public getElytra() {
        return this.elytra;
    }

    public getCloak() {
        return this.cloak;
    }
}
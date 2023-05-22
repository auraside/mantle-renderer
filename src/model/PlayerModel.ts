import { BoxGeometry, DisplayP3ColorSpace, DoubleSide, FrontSide, Group, LinearFilter, Material, MeshStandardMaterial, NearestFilter, SRGBColorSpace, Texture, TextureLoader } from "three";
import ModelPart from "./ModelPart.js";
import { getBoxUVs, setUvs, updateMaterialTexture } from "../ModelUtils.js";
import PlayerModelOptions from "../interface/PlayerModelOptions.js";
import { stringToSkinUrl } from "../Utils.js";

export default class PlayerModel {
    private group = new Group();
    private modelParts: Map<string, ModelPart> = new Map();
    private skinTexture: Texture | undefined;
    private skinMaterial: Material;
    private transparentSkinMaterial: Material;

    public constructor(options: PlayerModelOptions) {
        this.skinMaterial = new MeshStandardMaterial({
            side: FrontSide
        });
        this.transparentSkinMaterial = new MeshStandardMaterial({
            side: DoubleSide,
            transparent: true,
            alphaTest: 1e-5
        });

        this.setSkin(options.skin);


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
                part: this.getBodyPart("head")!
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
                part: this.getBodyPart("armLeft")!
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
                part: this.getBodyPart("armRight")!
            }
        ));


        // left leg & trouser
        const legLeftGeometry = new BoxGeometry(4, 12, 4);
        setUvs(legLeftGeometry, getBoxUVs(16, 48, 4, 12, 4, 64, 64));
        this.modelParts.set("legLeft", new ModelPart(
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
        this.modelParts.set("trouserLeft", new ModelPart(
            trouserLeftGeometry,
            this.transparentSkinMaterial,
            {
                part: this.getBodyPart("legLeft")!
            }
        ));


        // right leg & trouser
        const legRightGeometry = new BoxGeometry(4, 12, 4);
        setUvs(legRightGeometry, getBoxUVs(0, 16, 4, 12, 4, 64, 64));
        this.modelParts.set("legRight", new ModelPart(
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
        this.modelParts.set("trouserRight", new ModelPart(
            trouserRightGeometry,
            this.transparentSkinMaterial,
            {
                part: this.getBodyPart("legRight")!
            }
        ));



        this.setSlim(!!options.slim);
        this.group.add(body.pivot);
    }

    public getMesh() {
        return this.group;
    }

    public getBodyPart(name: string) {
        return this.modelParts.get(name);
    }

    public setSlim(slim: boolean) {
        const armWidth = slim ? 3 : 4;

        const armLeft = this.modelParts.get("armLeft")!;
        armLeft.mesh.scale.set(armWidth, 12, 4);
        setUvs(armLeft.geometry, getBoxUVs(32, 48, armWidth, 12, 4, 64, 64));
        armLeft.pivot.position.setX(slim ? 5.5 : 6);

        const sleeveLeft = this.modelParts.get("sleeveLeft")!;
        sleeveLeft.mesh.scale.set((armWidth + 0.5) / armWidth, 12.5 / 12, 5 / 4);
        setUvs(sleeveLeft.geometry, getBoxUVs(48, 48, armWidth, 12, 4, 64, 64));


        const armRight = this.modelParts.get("armRight")!;
        armRight.mesh.scale.set(armWidth, 12, 4);
        setUvs(armRight.geometry, getBoxUVs(40, 16, armWidth, 12, 4, 64, 64));
        armRight.pivot.position.setX(slim ? -5.5 : -6);

        const sleeveRight = this.modelParts.get("sleeveRight")!;
        sleeveRight.mesh.scale.set((armWidth + 0.5) / armWidth, 12.5 / 12, 5 / 4);
        setUvs(sleeveRight.geometry, getBoxUVs(40, 32, armWidth, 12, 4, 64, 64));
    }

    public setSkin(skin: string) {
        if (this.skinTexture) {
            this.skinTexture.dispose();
        }

        this.skinTexture = new TextureLoader().load(stringToSkinUrl(skin));
        this.skinTexture.magFilter = NearestFilter;
        this.skinTexture.minFilter = LinearFilter;
        this.skinTexture.colorSpace = SRGBColorSpace;

        updateMaterialTexture(this.skinMaterial, this.skinTexture, false);
        updateMaterialTexture(this.transparentSkinMaterial, this.skinTexture, false);        
    }
}
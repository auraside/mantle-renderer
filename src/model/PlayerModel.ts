import { BoxGeometry, DisplayP3ColorSpace, DoubleSide, FrontSide, Group, LinearFilter, MeshStandardMaterial, NearestFilter, SRGBColorSpace, TextureLoader } from "three";
import ModelPart from "./ModelPart.js";
import { getBoxUVs, setUvs } from "../ModelUtils.js";
import PlayerModelOptions from "../interface/PlayerModelOptions.js";
import { stringToSkinUrl } from "../Utils.js";

export default class PlayerModel {
    private group = new Group();
    private modelParts: Map<string, ModelPart> = new Map();

    // todo: add outer layer

    public constructor(options: PlayerModelOptions) {
        const texture = new TextureLoader().load(stringToSkinUrl(options.skin));
        texture.magFilter = NearestFilter;
        texture.minFilter = LinearFilter;
        texture.colorSpace = SRGBColorSpace;

        const material = new MeshStandardMaterial({
            map: texture,
            side: FrontSide
        });
        const transparentMaterial = new MeshStandardMaterial({
            map: texture,
            side: DoubleSide,
            transparent: true,
            alphaTest: 1e-5
        });


        // body & jacket
        const bodyGeometry = new BoxGeometry(8, 12, 4);
        setUvs(bodyGeometry, getBoxUVs(16, 16, 8, 12, 4, 64, 64));
        this.modelParts.set("body", new ModelPart(
            bodyGeometry,
            material
        ));
        const body = this.getBodyPart("body")!;
        const jacketGeometry = new BoxGeometry(8.5, 12.5, 4.5);
        setUvs(jacketGeometry, getBoxUVs(16, 32, 8, 12, 4, 64, 64));
        this.modelParts.set("jacket", new ModelPart(
            jacketGeometry,
            transparentMaterial,
            {
                part: body
            }
        ));


        // head & hat
        const headGeometry = new BoxGeometry(8, 8, 8);
        setUvs(headGeometry, getBoxUVs(0, 0, 8, 8, 8, 64, 64));
        this.modelParts.set("head", new ModelPart(
            headGeometry,
            material,
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
            transparentMaterial,
            {
                part: this.getBodyPart("head")!
            }
        ));

        
        // left arm & sleeve
        this.modelParts.set("armLeft", new ModelPart(
            new BoxGeometry(1, 1, 1),
            material,
            {
                part: body,
                yAttachment: 4
            }
        ));
        this.modelParts.set("sleeveLeft", new ModelPart(
            new BoxGeometry(1, 1, 1),
            transparentMaterial,
            {
                part: this.getBodyPart("armLeft")!
            }
        ));
        

        // right arm & sleeve
        this.modelParts.set("armRight", new ModelPart(
            new BoxGeometry(1, 1, 1),
            material,
            {
                part: body,
                yAttachment: 4
            }
        ));
        this.modelParts.set("sleeveRight", new ModelPart(
            new BoxGeometry(1, 1, 1),
            transparentMaterial,
            {
                part: this.getBodyPart("armRight")!
            }
        ));


        // left leg & trouser
        const legLeftGeometry = new BoxGeometry(4, 12, 4);
        setUvs(legLeftGeometry, getBoxUVs(16, 48, 4, 12, 4, 64, 64));
        this.modelParts.set("legLeft", new ModelPart(
            legLeftGeometry,
            material,
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
            transparentMaterial,
            {
                part: this.getBodyPart("legLeft")!
            }
        ));


        // right leg & trouser
        const legRightGeometry = new BoxGeometry(4, 12, 4);
        setUvs(legRightGeometry, getBoxUVs(0, 16, 4, 12, 4, 64, 64));
        this.modelParts.set("legRight", new ModelPart(
            legRightGeometry,
            material,
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
            transparentMaterial,
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
}
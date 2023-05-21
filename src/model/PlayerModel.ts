import { BoxGeometry, FrontSide, Group, MeshStandardMaterial, NearestFilter, TextureLoader, sRGBEncoding } from "three";
import ModelPart from "./ModelPart.js";
import { getBoxUVs, setUvs } from "../ModelUtils.js";

export default class PlayerModel {
    private group = new Group();
    private modelParts: Map<string, ModelPart> = new Map();

    // todo: add outer layer

    public constructor(skinUrl: string) {
        const texture = new TextureLoader().load(skinUrl);
        texture.magFilter = NearestFilter;
        texture.encoding = sRGBEncoding; // todo: find newer solution for this

        const material = new MeshStandardMaterial({
            map: texture,
            side: FrontSide
        });

        const bodyGeometry = new BoxGeometry(8, 12, 4);
        setUvs(bodyGeometry, getBoxUVs(16, 16, 8, 12, 4, 64, 64));
        this.modelParts.set("body", new ModelPart(
            bodyGeometry,
            material
        ));
        const body = this.getBodyPart("body")!;


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

        const armLeftGeometry = new BoxGeometry(4, 12, 4);
        setUvs(armLeftGeometry, getBoxUVs(32, 48, 4, 12, 4, 64, 64));
        this.modelParts.set("armLeft", new ModelPart(
            armLeftGeometry,
            material,
            {
                part: body,
                xOffset: 6,
                yAttachment: 4
            }
        ));

        const armRightGeometry = new BoxGeometry(4, 12, 4);
        setUvs(armRightGeometry, getBoxUVs(40, 16, 4, 12, 4, 64, 64));
        this.modelParts.set("armRight", new ModelPart(
            armRightGeometry,
            material,
            {
                part: body,
                xOffset: -6,
                yAttachment: 4
            }
        ));

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

        this.group.add(body.group);
    }

    public getMesh() {
        return this.group;
    }

    public getBodyPart(name: string) {
        return this.modelParts.get(name);
    }
}
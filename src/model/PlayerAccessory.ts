import { Group } from "three";
import { Coordinate, GenericModel } from "../Index.js";
import { BasePlatformUtils } from "../platformSpecifics/BasePlatformUtils.js";
import { Model } from "./Model.js";

export interface PlayerAccessoryOptions {
    frames?: number
    frame?: number
}

export class PlayerAccessory extends Model {
    private offsetGroup = new Group();

    constructor(model: GenericModel, platformUtils: BasePlatformUtils, options: PlayerAccessoryOptions = {}) {
        super({
            ...model,
            offset: [0, 0, 0]
        }, platformUtils, {
            frames: options.frames,
            frame: options.frame
        });
        this.setOffset(model.offset ?? [0, 0, 0]);
    }

    public async build(srgb = false) {
        if (this.isBuilding) {
            return;
        }
        await super.build(srgb);
        const children = [...this.mesh.children];
        this.mesh.remove(...children);
        this.offsetGroup.add(...children);
        this.mesh.add(this.offsetGroup);
    }

    public setOffset(offset: Coordinate) {
        this.offsetGroup.position.set(...offset);
    }

    public setScale(scale: number) {
        this.mesh.scale.set(scale, scale, scale);
    }
}
import { BufferGeometry, Group, Material, Mesh } from "three";
import { ModelPartParent } from "../interface/ModelPartParent.js";

export type ModelPartId = "head" | "hat" | "body" | "jacket" | "armLeft" | "sleeveLeft" | "armRight" | "sleeveRight" | "legLeft" | "trouserLeft" | "legRight" | "trouserRight";

export class ModelPart {
    public mesh: Mesh;
    public pivot = new Group();

    public constructor(
        public readonly geometry: BufferGeometry,
        public readonly materials: Material | Material[],
        private readonly parent?: ModelPartParent
    ) {
        this.mesh = new Mesh(this.geometry, this.materials);
        this.pivot.add(this.mesh);

        if (this.parent) {
            const xA = this.parent.xAttachment ?? 0;
            const yA = this.parent.yAttachment ?? 0;
            const zA = this.parent.zAttachment ?? 0;

            this.pivot.position.set(
                (this.parent.xOffset ?? 0) + xA,
                (this.parent.yOffset ?? 0) + yA,
                (this.parent.zOffset ?? 0) + zA
            );
            this.mesh.position.set(
                -xA,
                -yA,
                -zA
            )
            this.parent.part.mesh.add(this.pivot);
        }
    }
}
import { BufferGeometry, Group, Material, Mesh } from "three";
import ModelPartParent from "../interface/ModelPartParent.js";

export default class ModelPart {
    public mesh: Mesh;
    public group = new Group();

    public constructor(
        public readonly geometry: BufferGeometry,
        public readonly material: Material,
        private readonly parent?: ModelPartParent
    ) {
        this.mesh = new Mesh(this.geometry, this.material);
        this.group.add(this.mesh);

        if (this.parent) {
            const xA = this.parent.xAttachment ?? 0;
            const yA = this.parent.yAttachment ?? 0;
            const zA = this.parent.zAttachment ?? 0;

            this.group.position.set(
                (this.parent.xOffset ?? 0) + xA,
                (this.parent.yOffset ?? 0) + yA,
                (this.parent.zOffset ?? 0) + zA
            );
            this.mesh.position.set(
                -xA,
                -yA,
                -zA
            )
            this.parent.part.group.add(this.group);
        }
    }
}
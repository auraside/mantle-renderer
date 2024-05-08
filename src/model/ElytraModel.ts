import { BoxGeometry, DoubleSide, Group, LinearFilter, Mesh, MeshLambertMaterial, NearestFilter, SRGBColorSpace, Texture } from "three";
import { disposeOfGroup, getBoxUVs, setUvs } from "../ModelUtils.js";
import { DisposableObject } from "../interface/DisposableObject.js";
import { BasePlatformUtils } from "../platformSpecifics/BasePlatformUtils.js";

export interface ElytraModelOptions {
    url?: string | null
    spread?: number
}

export class ElytraModel {
    private url: string | null = null;
    private readonly geometry: BoxGeometry;
    private readonly left: Group;
    private readonly right: Group;
    private readonly group: Group;
    private readonly disposables: DisposableObject[] = [];
    private abortTexture: () => void = () => {};
    private frames = 1;
    private frame = 0;

    private texture: Texture | null = null;
    private material = new MeshLambertMaterial({
        side: DoubleSide,
        transparent: true,
        alphaTest: 1e-5,
        visible: false
    });

    constructor(private readonly platformUtils: BasePlatformUtils, options: ElytraModelOptions = {}) {
        this.geometry = new BoxGeometry(10, 20, 2);
        // setUvs(this.geometry, getBoxUVs(22, 0, 10, 20, 2, 64, 32));

        const right = new Mesh(this.geometry, this.material);
        this.right = new Group();
        right.position.set(-5, -10, 0);
        right.scale.set(-1, 1, 1);
        this.right.add(right);
        this.right.position.set(4, 0, 0);
        this.right.rotation.set(0, -0.1, 0.26); // z is spread

        const left = new Mesh(this.geometry, this.material);
        this.left = new Group();
        left.position.set(5, -10, 0);
        left.scale.set(1, 1, 1);
        this.left.add(left);
        this.left.position.set(-4, 0, 0);
        this.left.rotation.set(0, 0.1, -0.26); // z is -spread

        const elytra = new Group();
        elytra.add(this.left, this.right);
        elytra.rotation.set(-0.3, 0, 0);

        this.group = new Group();
        this.group.add(elytra);

        this.setFrame(1);
        this.setSpread(options.spread ?? 0);
        this.setTexture(options.url ?? null);

        this.disposables.push(this.material, this.geometry);
    }

    public setSpread(spread: number) {
        spread = Math.min(Math.max(spread, 0), 1);

        this.right.rotation.z = 0.26 + spread;
        this.left.rotation.z = -0.26 - spread;
    }

    public dispose() {
        this.disposables.forEach(d => d.dispose());
        disposeOfGroup(this.group);
    }

    public getMesh() {
        return this.group;
    }

    public async setTexture(url: string | null, frames = 1) {
        if (this.url == url) {
            return;
        }
        this.abortTexture();
        let aborted = false;
        this.abortTexture = () => aborted = true;
        this.material.visible = false;
        this.frames = Math.max(frames, 1);
        this.setUvs();
        this.url = url;
        if (this.texture) {
            this.texture.dispose();
        }
        if (!url) {
            this.texture = null;
            this.material.map = null;
            this.material.needsUpdate = true;
            return;
        }
        await new Promise<void>(r => r()); // delay so geometry uvs can update to match frames

        const texture = await this.platformUtils.createTexture(url);
        if (aborted) {
            texture.dispose();
            return;
        }
        this.texture = texture;
        this.material.visible = true;
        this.texture.magFilter = NearestFilter;
        this.texture.minFilter = LinearFilter;
        this.texture.colorSpace = SRGBColorSpace;
        this.material.map = this.texture;
        this.material.needsUpdate = true;
    }

    private setUvs() {
        setUvs(this.geometry, getBoxUVs(22, 32 * (this.frame % this.frames), 10, 20, 2, 64, 32 * this.frames));
        this.geometry.getAttribute("uv").needsUpdate = true;
    }

    public setFrame(frame: number) {
        if (this.frame == frame) {
            return;
        }
        this.frame = frame;
        this.setUvs();
    }
}
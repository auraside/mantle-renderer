import { BoxGeometry, DoubleSide, Group, LinearFilter, Mesh, MeshLambertMaterial, NearestFilter, SRGBColorSpace, Texture } from "three";
import { BasePlatformUtils } from "../platformSpecifics/BasePlatformUtils.js";
import { formatCloak, getBoxUVs, setUvs } from "../ModelUtils.js";

export interface CloakModelOptions {
    url?: string | null
    angle?: number
}

export class CloakModel {
    private url: string | null = null;
    private frames = 1;
    private frame = 0;
    private readonly geometry: BoxGeometry;
    private texture: Texture | null = null;
    private readonly mesh: Group;
    private material = new MeshLambertMaterial({
        side: DoubleSide,
        transparent: true,
        alphaTest: 1e-5,
        visible: false
    });
    private textureAbort: () => void = () => {};
    
    constructor(private readonly platformUtils: BasePlatformUtils, options: CloakModelOptions = {}) {
        this.geometry = new BoxGeometry(10, 16, 1);

        const mesh = new Mesh(this.geometry, this.material);
        mesh.scale.set(-1, 1, -1);
        mesh.position.set(0, -8, 0.5);
        this.mesh = new Group();
        this.mesh.add(mesh);

        this.setFrame(1);
        this.setTexture(options.url ?? null);
        this.setAngle(options.angle ?? 0.5);
    }

    public getMesh() {
        return this.mesh;
    }

    public async setTexture(url: string | null, frames = 1) {
        if (this.url == url) {
            return;
        }
        this.textureAbort();
        let aborted = false;
        this.textureAbort = () => aborted = true;

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
        
        const canvas = await formatCloak(url, this.platformUtils, frames);
        const texture = await this.platformUtils.createTexture(canvas);
        if (aborted) {
            texture.dispose();
            return;
        }
        this.texture = texture;
        this.texture.magFilter = NearestFilter;
        this.texture.minFilter = LinearFilter;
        this.texture.colorSpace = SRGBColorSpace;
        this.material.map = this.texture;
        this.material.visible = true;
        this.material.needsUpdate = true;
    }

    public setAngle(angle: number) {
        angle = -Math.max(Math.min(angle, Math.PI), 0);
        this.mesh.rotation.x = angle;
    }

    private setUvs() {
        setUvs(this.geometry, getBoxUVs(0, 17 * (this.frame % this.frames), 10, 16, 1, 22, 17 * this.frames));
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
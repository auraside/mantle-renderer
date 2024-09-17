import { BoxGeometry, CanvasTexture, Group, Material, Mesh, MeshNormalMaterial, Texture, Vector2 } from "three";
import { DisposableObject, GenericModel, GenericModelFace, ModelInfoTexture, ModelPart, createMaterial, disposeOfGroup, getFaceVertices, orderUvs, setUvs } from "../Index.js";
import { BasePlatformUtils } from "../platformSpecifics/BasePlatformUtils.js";
import type { Canvas } from "canvas";

export interface ModelOptions {
    frames?: number
    frame?: number
}

interface ModelTexture extends ModelInfoTexture {
    ctx: CanvasRenderingContext2D | null
    frame: HTMLCanvasElement | Canvas | null
    srgb: boolean
}

export class Model {
    private built = false;
    protected isBuilding = false;
    protected readonly mesh = new Group();
    private readonly textures: Record<string, ModelTexture> = {};
    private frames: number;
    private frame: number;

    constructor(private readonly model: GenericModel, private readonly platformUtils: BasePlatformUtils, options: ModelOptions = {}) {
        this.frames = options.frames ?? 1;
        this.frame = options.frame ?? 0;
    }

    async build(srgb = false) {
        if (this.built) {
            throw new Error("Model is already built");
        }
        if (this.isBuilding) {
            return;
        }
        this.isBuilding = true;
        
        const faceOrder: GenericModelFace[] = ["top", "bottom", "left", "right", "back", "front"]; // todo: order this to properly support multiple textures
        const promises: Promise<void>[] = [];

        for (let i = 0; i < this.model.textures.length; i++) {
            const textureData = this.model.textures[i];
            
            const promise = new Promise<void>(async resolve => {
                if (textureData.url) {
                    const canvas = await this.platformUtils.urlToCanvas(textureData.url);
                    this.textures[textureData.name] = this.buildModelTexture(canvas, srgb);
                } else {
                    this.textures[textureData.name] = this.buildModelTexture(null, srgb);
                }
    
                resolve();
            });
            promises.push(promise);
        }

        await Promise.allSettled(promises);
        this.setFrame(this.frame);

        for (let index = 0; index < this.model.elements.length; index++) {
            const element = this.model.elements[index];
    
            const geometry = new BoxGeometry(...element.size);
            const uvs: Map<GenericModelFace, Vector2[]> = new Map();
    
            for (let i = 0; i < 6; i++) {
                const uv = element.uv[faceOrder[i]];
                const textureInfo = this.model.textures.find(t => t.name == uv.texture);
                if (textureInfo) {
                    const vertices = getFaceVertices(uv.uv[0], uv.uv[1], uv.uv[2], uv.uv[3], textureInfo.width, textureInfo.height, uv.rotation);
                    uvs.set(faceOrder[i], vertices);
                }
            }
            
            const orderedUvs = orderUvs(uvs.get("top")!, uvs.get("bottom")!, uvs.get("left")!, uvs.get("right")!, uvs.get("front")!, uvs.get("back")!);
            setUvs(geometry, orderedUvs);
    
            const firstMaterial = Object.values(this.textures)[0].material; // todo: support multiple textures
    
            const part = new ModelPart(
                geometry,
                firstMaterial
            );
            part.pivot.position.set(...element.origin);
            part.mesh.position.set(
                element.position[0] - element.origin[0],
                element.position[1] - element.origin[1],
                element.position[2] - element.origin[2]
            );
            part.pivot.rotation.set(...element.rotation);
            part.mesh.userData.textureName = element.uv.top.texture;
            this.mesh.add(part.pivot);
        }
        this.isBuilding = false;
        this.built = true;
    }

    getMesh() {
        if (!this.built) {
            throw new Error("Model is not built");
        }
        return this.mesh;
    }

    public getTextures() {
        if (!this.mesh) {
            throw new Error("Player Accessory is not built");
        }
        return this.textures;
    }

    async replaceTexture(name: string, url: string | null, srgb = false) {
        const info = this.textures[name];

        if (!info) {
            throw new Error("Texture not found");
        }

        if (url) {
            const canvas = await this.platformUtils.urlToCanvas(url);
            this.textures[name] = this.buildModelTexture(canvas, srgb);
        } else {
            this.textures[name] = this.buildModelTexture(null, srgb);
        }
        this.updateMaterials();

        info.material.dispose?.();
        info.texture?.dispose?.();
        this.setFrame(this.frame);
    }

    public dispose() {
        if (this.mesh) {
            this.mesh.parent?.remove(this.mesh);
            disposeOfGroup(this.mesh, true);
        }
    }

    public setFrame(frame: number) {
        this.frame = frame % this.frames;

        for (let name in this.textures) {
            const info = this.textures[name];

            if (info.ctx && info.frame && info.texture) {
                info.ctx.clearRect(0, 0, info.frame.width, info.frame.height);
                info.ctx.drawImage(info.canvas as HTMLCanvasElement, 0, info.frame.height * this.frame, info.frame.width, info.frame.height, 0, 0, info.frame.width, info.frame.height);
                info.texture.needsUpdate = true;
            }
        }
    }

    public getFrame() {
        return this.frame;
    }

    public getFrames() {
        return this.frames;
    }

    public setFrames(frames: number) {
        this.frames = frames;
        this.setFrame(this.frame);

        for (let name in this.textures) {
            const info = this.textures[name];

            this.textures[name] = this.buildModelTexture(info.canvas, info.srgb);
        }
        this.setFrame(this.frame);
        this.updateMaterials();
    }

    private buildModelTexture(canvas: Canvas | HTMLCanvasElement | null, srgb: boolean): ModelTexture {
        let material: Material;
        let texture: Texture | null = null;
        let ctx: CanvasRenderingContext2D | null = null;
        let frame: HTMLCanvasElement | Canvas | null = null;
        if (canvas) {
            frame = this.platformUtils.create2dCanvas(canvas.width, canvas.height / this.frames) as HTMLCanvasElement;
            ctx = frame.getContext("2d")!;
            texture = new CanvasTexture(frame)
            material = createMaterial(texture, srgb);
        } else {
            material = new MeshNormalMaterial();
        }

        return {
            material,
            texture,
            ctx,
            frame,
            canvas,
            srgb
        }
    }

    private updateMaterials() {
        const toDispose = new Set<DisposableObject>();

        this.mesh.traverse(child => {
            if (child.type == "Mesh") {
                const mesh = child as Mesh;
                const textureName = mesh.userData.textureName;
                const info = this.textures[textureName];
                if (info) {
                    if (Array.isArray(mesh.material)) {
                        for (let material of mesh.material) {
                            toDispose.add(material);
                            // @ts-expect-error
                            const texture = material.map as Texture;
                            if (texture) {
                                toDispose.add(texture);
                            }
                        }
                    } else {
                        toDispose.add(mesh.material);
                        // @ts-expect-error
                        const texture = mesh.material.map as Texture;
                        if (texture) {
                            toDispose.add(texture);
                        }
                    }
                    mesh.material = info.material;
                }
            }
        });

        for (let object of toDispose) {
            object.dispose?.();
        }
    }
}
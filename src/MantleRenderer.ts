import { AmbientLight, FloatType, LinearFilter, NoToneMapping, PCFSoftShadowMap, PerspectiveCamera, PointLight, RGBAFormat, SRGBColorSpace, Scene, UnsignedByteType, Vector2, WebGLRenderTarget, WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";
import { SSAARenderPass } from "three/addons/postprocessing/SSAARenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RendererOptions from "./interface/RendererOptions.js";
import PlayerModel from "./model/PlayerModel.js";
import DisposableObject from "./interface/DisposableObject.js";
import BasePlatformUtils, { Platform } from "./platformSpecifics/BasePlatformUtils.js";
import { Canvas } from "canvas";

export type EventType = "resize" | "prerender" | "postrender";

export default class MantleRenderer {
    private destroyed = false;
    private readonly renderer: WebGLRenderer;
    public readonly platformUtils: BasePlatformUtils;
    private readonly composer: EffectComposer | null = null;
    public readonly scene = new Scene();
    public readonly camera: PerspectiveCamera;
    private readonly ambientLight: AmbientLight;
    public readonly player: PlayerModel | undefined;
    public readonly controls: OrbitControls | null;
    private eventListeners: Map<EventType, (() => void)[]> = new Map();
    private lastRenderTime = 0;
    private renderTime = 0;
    private disposableObjects: DisposableObject[] = [];

    public constructor(options: RendererOptions) {
        this.scene = new Scene();
        this.platformUtils = options.platformUtils;

        const canvas = options.canvas || this.platformUtils.create3dCanvas(500, 500);

        // renderer
        this.renderer = new WebGLRenderer({
            canvas: canvas as HTMLCanvasElement,
            antialias: options.antialias,
            alpha: !!options.alpha,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(this.platformUtils.getDevicePixelRatio());
        if (options.shadows) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = PCFSoftShadowMap;
        }

        if (options.live) {
            this.renderer.setAnimationLoop(time => this.render(time));
        }
        this.disposableObjects.push(this.renderer);
        
        // camera
        this.camera = new PerspectiveCamera(options.fov ?? 70, 1, 0.1, 1000);
        this.camera.position.set(0, 0, -40);
        this.scene.add(this.camera);

        //shaders
        const shouldUseEffectComposer = !!options.fxaa || 1; // add other shaders here
        if (shouldUseEffectComposer) {
            const mantleRenderer = this;
            this.renderer.toneMapping = NoToneMapping;
            this.renderer.outputColorSpace = SRGBColorSpace;
            

            let renderTarget: WebGLRenderTarget | undefined;
            const size = this.renderer.getDrawingBufferSize(new Vector2());
            renderTarget = new WebGLRenderTarget(size.width, size.height, {
                minFilter: LinearFilter,
                magFilter: LinearFilter,
                format: RGBAFormat,
                type: FloatType
            });
            this.disposableObjects.push(renderTarget);

            this.addEventListener("resize", () => {
                const size = this.renderer.getDrawingBufferSize(new Vector2());
                renderTarget?.setSize(size.width, size.height);
            });

            this.composer = new EffectComposer(this.renderer, renderTarget);
            this.composer.setPixelRatio(this.renderer.getPixelRatio());
            this.disposableObjects.push(this.composer);

            if (options.ssaa) {
                const ssaaPass = new SSAARenderPass(this.scene, this.camera, 0x000000, 0);
                function ssaaResize() {
                    ssaaPass.setSize(canvas.offsetWidth, canvas.offsetHeight);
                }
                ssaaResize();
                ssaaPass.unbiased = true;
                ssaaPass.sampleLevel = 4;
                this.composer.addPass(ssaaPass);
                this.disposableObjects.push(ssaaPass);
            } else {
                const renderPass = new RenderPass(this.scene, this.camera);
                this.composer.addPass(renderPass);
                this.disposableObjects.push(renderPass);
            }

            

            this.addEventListener("resize", () => {
                this.composer?.setSize(canvas.offsetWidth, canvas.offsetHeight);
            });

            
            
            const gammaPass = new ShaderPass(GammaCorrectionShader); // gamma correction should be last/2nd-to-last before fxaa
            this.composer.addPass(gammaPass);
            this.disposableObjects.push(gammaPass);

            if (options.fxaa) {
                const fxaaPass = new ShaderPass(FXAAShader);
                function fxaaResize() {
                    fxaaPass.material.uniforms["resolution"].value.x = 1 / (canvas.offsetWidth * mantleRenderer.renderer.getPixelRatio());
                    fxaaPass.material.uniforms["resolution"].value.y = 1 / (canvas.offsetHeight * mantleRenderer.renderer.getPixelRatio());
                }
                fxaaResize();
                this.composer.addPass(fxaaPass);
                this.disposableObjects.push(fxaaPass);
                this.addEventListener("resize", fxaaResize);
            }

            if (options.bloom) {
                const bloomPass = new UnrealBloomPass(new Vector2(canvas.offsetWidth * this.renderer.getPixelRatio(), canvas.offsetHeight * this.renderer.getPixelRatio()), options.bloom.strength, options.bloom.radius, options.bloom.threshold);
                this.disposableObjects.push(bloomPass);
                this.composer.addPass(bloomPass);
                function bloomResize() {
                    bloomPass.resolution.setX(canvas.offsetWidth * mantleRenderer.renderer.getPixelRatio());
                    bloomPass.resolution.setY(canvas.offsetHeight * mantleRenderer.renderer.getPixelRatio());
                }
                this.addEventListener("resize", bloomResize);
            }
        }

        if (options.controls) {
            if (this.platformUtils.getPlatform() == Platform.SERVER) {
                console.warn("Controls are automatically disabled as they aren't supported server-side.");
                this.controls = null;
            } else {
                this.controls = new OrbitControls(this.camera, canvas as HTMLCanvasElement);
                this.disposableObjects.push(this.controls);
            }
        } else {
            this.controls = null;
        }

        // ambient light
        this.ambientLight = new AmbientLight(options.ambientLight?.color ?? 0xffffff, options.ambientLight?.intensity ?? 0);
        this.scene.add(this.ambientLight);
        this.disposableObjects.push(this.ambientLight);

        // player model
        if (options.player) {
            this.player = new PlayerModel(this, {
                skin: options.player.skin || "https://textures.minecraft.net/texture/31f477eb1a7beee631c2ca64d06f8f68fa93a3386d04452ab27f43acdf1b60cb",
                slim: !!options.player.slim,
                onSkinLoad: options.player.onSkinLoad
            });
            this.scene.add(this.player.getMesh());
            this.player.getMesh().rotation.y = 0.5;
            this.disposableObjects.push(this.player);

            this.camera.lookAt(this.player.getMesh().position);
        }
    }

    public setSize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.callEvent("resize");
    }

    public addEventListener(event: EventType, callback: () => void) {
        const callbacks = this.eventListeners.get(event);
        if (callbacks) {
            if (!callbacks.includes(callback)) {
                callbacks.push(callback);
            }
        } else {
            this.eventListeners.set(event, [callback]);
        }
    }

    public removeEventListener(event: EventType, callback: () => void) {
        const callbacks = this.eventListeners.get(event);
        if (!callbacks) return;
        const index = callbacks.indexOf(callback);
        if (index >= 0) {
            callbacks.splice(index, 1);
        }
    }

    private callEvent(event: EventType) {
        const callbacks = this.eventListeners.get(event);
        if (!callbacks) return;
        for (let callback of callbacks) {
            callback();
        }
    }

    public getRenderTime() {
        return this.renderTime;
    }

    public getLastFrameDuration() {
        return this.renderTime - this.lastRenderTime;
    }

    public render(time: number) {
        if (this.destroyed) return;

        this.lastRenderTime = this.renderTime;
        this.renderTime = time;
        this.callEvent("prerender");
        
        this.controls?.update();

        if (this.composer) {
            this.composer.render(time);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        
        this.callEvent("postrender");
    }

    public destroy(clearCanvas?: boolean) {
        this.destroyed = true;
        if (this.player) {
            this.scene.remove(this.player.getMesh());
        }
        if (clearCanvas) {
            this.renderer.clear();
        }

        
        for (let object of this.disposableObjects) {
            try {
                object.dispose();
            } catch {}
        }
    }

    public getCanvas() {
        return this.renderer.domElement;
    }

    // Anti-Aliasing is patchy client-side, uasge of this is only encouraged for server-side rendering. Client side applications can just .toDataURL() the canvas.
    public screenshot(width: number, height: number, mimeType: "png" | "jpeg", superSampling?: number) {
        superSampling = Math.max(Math.round(superSampling || 1), 1);

        width *= superSampling;
        height *= superSampling;

        const cameraAspect = this.camera.aspect;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        const canvas = this.platformUtils.create3dCanvas(width, height);
        const renderer = new WebGLRenderer({
            canvas: canvas as unknown as HTMLCanvasElement,
            alpha: true,
            powerPreference: "high-performance",
            antialias: true,
            context: canvas.getContext("3d")
        });
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = PCFSoftShadowMap;

        const renderTarget = new WebGLRenderTarget(width, height, {
            minFilter: LinearFilter,
            magFilter: LinearFilter,
            format: RGBAFormat,
            type: UnsignedByteType
        });
        renderer.setRenderTarget(renderTarget);
        renderer.render(this.scene, this.camera);
        

        const frameBufferPixels = new Uint8Array(width * height * 4);
        const context = renderer.getContext();
        context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, frameBufferPixels);

        const pixels = new Uint8Array(width * height * 4);
        for (let fbRow = 0; fbRow < height; fbRow++) {
            let rowData = frameBufferPixels.subarray(fbRow * width * 4, (fbRow + 1) * width * 4);
            let imgRow = height - fbRow - 1;
            pixels.set(rowData, imgRow * width * 4);
        }

        const canvas2d = this.platformUtils.create2dCanvas(width, height) as any;
        const ctx = canvas2d.getContext("2d");
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);



        this.camera.aspect = cameraAspect;
        this.camera.updateProjectionMatrix();

        try { // renderer dispose fails if server-side but still cleans up
            renderer.dispose();
        } catch {}
        renderTarget.dispose();

        if (superSampling > 1) {
            const originalWidth = width / superSampling;
            const originalHeight = height / superSampling;

            const shrinkCanvas = this.platformUtils.create2dCanvas(originalWidth, originalHeight) as Canvas;
            const ctx = shrinkCanvas.getContext("2d");
            ctx.drawImage(canvas2d, 0, 0, originalWidth, originalHeight);
            var base64 = shrinkCanvas.toDataURL(("image/" + mimeType) as any);
        } else {
            var base64 = canvas2d.toDataURL("image/" + mimeType) as string;
        }

        return base64;
    }
}
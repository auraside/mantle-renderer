import { AmbientLight, FloatType, LinearFilter, NoToneMapping, PCFSoftShadowMap, PerspectiveCamera, PointLight, RGBAFormat, SRGBColorSpace, Scene, UnsignedByteType, Vector2, WebGLRenderTarget, WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";
import { SSAARenderPass } from "three/addons/postprocessing/SSAARenderPass.js"

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RendererOptions from "./interface/RendererOptions.js";
import PlayerModel from "./model/PlayerModel.js";
import DisposableObject from "./interface/DisposableObject.js";
import { Platform } from "./platformSpecifics/BasePlatformUtils.js";
import { platformUtils } from "./Utils.js";

export type EventType = "resize" | "prerender" | "postrender";

export default class MantleRenderer {
    private destroyed = false;
    private readonly renderer: WebGLRenderer;
    private readonly composer: EffectComposer | null = null;
    public readonly scene = new Scene();
    public readonly camera: PerspectiveCamera;
    private readonly ambientLight: AmbientLight;
    public readonly player: PlayerModel | undefined;
    private readonly controls: OrbitControls | undefined;
    private eventListeners: Map<EventType, (() => void)[]> = new Map();
    private lastRenderTime = 0;
    private renderTime = 0;
    private disposableObjects: DisposableObject[] = [];

    public constructor(options: RendererOptions) {
        this.scene = new Scene();

        const canvas = options.canvas || platformUtils().create3dCanvas(500, 500);

        // renderer
        this.renderer = new WebGLRenderer({
            canvas: canvas as HTMLCanvasElement,
            antialias: options.antialias,
            alpha: !!options.alpha,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(platformUtils().getDevicePixelRatio());
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
        }

        if (options.controls) {
            if (platformUtils().getPlatform() == Platform.SERVER) {
                console.warn("Controls are automatically disabled as they aren't supported server-side.");
            } else {
                this.controls = new OrbitControls(this.camera, canvas as HTMLCanvasElement);
                this.disposableObjects.push(this.controls);
            }
        }

        // ambient light
        this.ambientLight = new AmbientLight(options.ambientLight?.color ?? 0xffffff, options.ambientLight?.intensity ?? 0);
        this.scene.add(this.ambientLight);
        this.disposableObjects.push(this.ambientLight);

        // player model
        if (options.player) {
            this.player = new PlayerModel(this, {
                skin: options.player.skin || "https://api.cosmetica.cc/get/skin?user=mhf_steve",
                slim: !!options.player.slim,
                onSkinLoad: options.player.onSkinLoad
            });
            this.scene.add(this.player.getMesh());
            this.player.getMesh().rotation.y = 0.5;
            this.disposableObjects.push(this.player);

            this.camera.lookAt(this.player.getMesh().position);
        }

        // point light (temporary)
        const light = new PointLight(0xffffff, 0.8, 1000);
        this.camera.add(light);
        light.position.set(0, 20, -10);
        this.disposableObjects.push(light);
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
            object.dispose();
        }
    }

    public getCanvas() {
        return this.renderer.domElement;
    }

    public screenshot(width: number, height: number) {
        const cameraAspect = this.camera.aspect;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        const canvas = platformUtils().create3dCanvas(width, height);
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
        for (let fbRow = 0; fbRow < height; fbRow++) { // framebuffer starts in bottom left but should be top left, invert vertically
            let rowData = frameBufferPixels.subarray(fbRow * width * 4, (fbRow + 1) * width * 4);
            let imgRow = height - fbRow - 1;
            pixels.set(rowData, imgRow * width * 4);
        }

        const canvas2d = platformUtils().create2dCanvas(width, height);
        const ctx = canvas2d.getContext("2d");
        const imageData = ctx.createImageData(width, height);
        imageData.data.set(pixels);
        ctx.putImageData(imageData, 0, 0);

        console.log("taken screenshot!");



        this.camera.aspect = cameraAspect;
        this.camera.updateProjectionMatrix();

        return canvas2d.toDataURL("image/png");
    }
}
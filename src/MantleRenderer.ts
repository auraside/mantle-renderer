import { AmbientLight, FloatType, LinearFilter, NoToneMapping, PerspectiveCamera, PointLight, RGBAFormat, SRGBColorSpace, Scene, Vector2, WebGLRenderTarget, WebGLRenderer } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";
import { SSAARenderPass } from "three/addons/postprocessing/SSAARenderPass.js"

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RendererOptions from "./interface/RendererOptions.js";
import PlayerModel from "./model/PlayerModel.js";

export type EventType = "resize" | "prerender" | "postrender";

export default class MantleRenderer {
    private readonly renderer: WebGLRenderer;
    private readonly composer: EffectComposer | null = null;
    private readonly scene = new Scene();
    private readonly camera: PerspectiveCamera;
    private readonly ambientLight: AmbientLight;
    public readonly player: PlayerModel;
    private readonly controls: OrbitControls;
    private eventListeners: Map<EventType, (() => void)[]> = new Map();
    private lastRenderTime = 0;
    private renderTime = 0;

    public constructor(options: RendererOptions) {
        this.scene = new Scene();

        // renderer
        this.renderer = new WebGLRenderer({
            canvas: options.canvas,
            antialias: options.antialias,
            alpha: !!options.alpha
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setAnimationLoop(time => this.render(time));
        
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

            this.addEventListener("resize", () => {
                const size = mantleRenderer.renderer.getDrawingBufferSize(new Vector2());
                renderTarget?.setSize(size.width, size.height);
            });

            this.composer = new EffectComposer(this.renderer, renderTarget);
            this.composer.setPixelRatio(this.renderer.getPixelRatio());

            if (options.ssaa) {
                const ssaaPass = new SSAARenderPass(this.scene, this.camera, 0x000000, 0);
                function ssaaResize() {
                    ssaaPass.setSize(options.canvas.offsetWidth, options.canvas.offsetHeight);
                }
                ssaaResize();
                ssaaPass.unbiased = true;
                ssaaPass.sampleLevel = 4;
                this.composer.addPass(ssaaPass);
            } else {
                const renderPass = new RenderPass(this.scene, this.camera);
                this.composer.addPass(renderPass);
            }

            

            this.addEventListener("resize", () => {
                mantleRenderer.composer?.setSize(options.canvas.offsetWidth, options.canvas.offsetHeight);
            });

            
            
            const gammaPass = new ShaderPass(GammaCorrectionShader); // gamma correction should be last/2nd-to-last before fxaa
            this.composer.addPass(gammaPass);

            if (options.fxaa) {
                const fxaaPass = new ShaderPass(FXAAShader);
                function fxaaResize() {
                    fxaaPass.material.uniforms["resolution"].value.x = 1 / (options.canvas.offsetWidth * mantleRenderer.renderer.getPixelRatio());
                    fxaaPass.material.uniforms["resolution"].value.y = 1 / (options.canvas.offsetHeight * mantleRenderer.renderer.getPixelRatio());
                }
                fxaaResize();
                this.composer.addPass(fxaaPass);
                this.addEventListener("resize", fxaaResize);
            }
        }

        this.controls = new OrbitControls(this.camera, options.canvas);

        // ambient light
        this.ambientLight = new AmbientLight(options.ambientLight?.color ?? 0xffffff, options.ambientLight?.intensity ?? 0);
        this.scene.add(this.ambientLight);

        // player model
        this.player = new PlayerModel(this, {
            skin: options.skin || "mhf_steve",
            slim: !!options.slim
        });
        this.scene.add(this.player.getMesh());
        this.player.getMesh().rotation.y = 0.5;

        this.camera.lookAt(this.player.getMesh().position);

        // point light (temporary)
        const light = new PointLight(0xffffff, 0.8, 1000);
        this.camera.add(light);
        light.position.set(0, 20, -10);
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
        this.lastRenderTime = this.renderTime;
        this.renderTime = time;
        this.callEvent("prerender");
        
        this.controls.update();

        if (this.composer) {
            this.composer.render(time);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        
        this.callEvent("postrender");
    }
}
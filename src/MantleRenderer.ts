import { AmbientLight, PerspectiveCamera, PointLight, Scene, WebGLRenderer } from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RendererOptions from "./interface/RendererOptions.js";
import PlayerModel from "./model/PlayerModel.js";

export default class MantleRenderer {
    private readonly renderer: WebGLRenderer;
    private readonly scene = new Scene();
    private readonly camera: PerspectiveCamera;
    private readonly ambientLight: AmbientLight;
    public readonly player: PlayerModel;
    private readonly controls: OrbitControls;

    public constructor(options: RendererOptions) {
        this.scene = new Scene();

        // renderer
        this.renderer = new WebGLRenderer({
            canvas: options.canvas,
            antialias: options.antialias
        });
        this.renderer.setAnimationLoop(time => this.render(time));
        
        // camera
        this.camera = new PerspectiveCamera(options.fov ?? 70, 1, 0.1, 1000);
        this.camera.position.set(0, 0, -40);
        this.scene.add(this.camera);

        this.controls = new OrbitControls(this.camera, options.canvas);

        // ambient light
        this.ambientLight = new AmbientLight(options.ambientLight?.color ?? 0xffffff, options.ambientLight?.intensity ?? 0);
        this.scene.add(this.ambientLight);

        // player model
        this.player = new PlayerModel({
            skin: options.skin || "mhf_steve",
            slim: !!options.slim
        });
        this.scene.add(this.player.getMesh());
        this.player.getMesh().rotation.y = 0.5;

        this.camera.lookAt(this.player.getMesh().position);

        // point light (temporary)
        const light = new PointLight(0xffffff, 1, 1000);
        this.camera.add(light);
        light.position.set(0, 20, -10);
    }

    public setSize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    public render(time: number) {
        // this.player.getBodyPart("body")!.pivot.rotation.y = time / 2_000;

        this.player.getBodyPart("armLeft")!.pivot.rotation.x = Math.sin(time / 150);
        this.player.getBodyPart("armRight")!.pivot.rotation.x = -Math.sin(time / 150);
        
        this.player.getBodyPart("legLeft")!.pivot.rotation.x = Math.sin(time / 150);
        this.player.getBodyPart("legRight")!.pivot.rotation.x = -Math.sin(time / 150);
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
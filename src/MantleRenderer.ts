import { AmbientLight, BoxGeometry, Mesh, MeshPhongMaterial, PerspectiveCamera, PointLight, Scene, WebGLRenderer } from "three";
import RendererOptions from "./interface/RendererOptions.js";

export default class MantleRenderer {
    private renderer: WebGLRenderer;
    private scene = new Scene();
    private camera: PerspectiveCamera;
    private ambientLight: AmbientLight;

    private box: Mesh;

    public constructor(options: RendererOptions) {
        this.scene = new Scene();
        this.renderer = new WebGLRenderer({
            canvas: options.canvas,
            antialias: !!options.antialias
        });

        this.renderer.setAnimationLoop(time => this.render(time));
        
        this.camera = new PerspectiveCamera(options.fov ?? 70, 1, 0.1, 100);
        this.camera.position.set(0, 0, -20);

        this.ambientLight = new AmbientLight(options.ambientLight?.color ?? 0xffffff, options.ambientLight?.intensity ?? 0);
        this.scene.add(this.ambientLight);



        const light = new PointLight(0xffffff, 1);
        this.scene.add(light);
        light.position.set(0, 20, -10);

        const boxGeometry = new BoxGeometry(1, 1, 1);
        const boxTexture = new MeshPhongMaterial({
            color: 0xff00f0
        });
        this.box = new Mesh(boxGeometry, boxTexture);

        this.scene.add(this.box);

        this.camera.lookAt(this.box.position);
    }

    public setSize(width: number, height: number) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    public render(time: number) {
        this.box.rotation.x = time / 1000;
        this.box.rotation.z = time / 5000;
        
        this.renderer.render(this.scene, this.camera);
    }
}
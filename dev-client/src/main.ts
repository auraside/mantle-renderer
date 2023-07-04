import './style.css'

import Renderer, { parseJavaBlockModel } from "../../src/Index";
import ModelInfo from '../../src/interface/ModelInfo';
import { BoxGeometry, DirectionalLight, Mesh, ShadowMaterial } from 'three';
import ClientPlatformUtils from '../../src/platformSpecifics/ClientPlatformUtils';

const canvas = document.createElement("canvas");
document.querySelector("#app")!.appendChild(canvas);




function loadModel(renderer: Renderer, id: string, bodyPart: string): Promise<ModelInfo> {
    return new Promise((resolve, reject) => {
        if (!renderer.player) return reject("Player isn't in scene");
        fetch(`https://dev-assets.mantle.gg/model/${id}.json`).then(r => r.json()).then(async r => {
            if (!renderer.player) throw "Player isn't in scene";
            const model = parseJavaBlockModel(r, `https://dev-assets.mantle.gg/model/${id}.png`, [-8, 8, -8], renderer.player.getBodyPart(bodyPart)!);
            const outModel = await renderer.player.addModel(model, true);

            outModel.mesh.traverse(child => {
                if (child.type == "Mesh") {
                    child.castShadow = true;
                }
            })

            resolve(outModel);
        });
    });
}



const renderer = new Renderer({
    live: true,
    platformUtils: new ClientPlatformUtils(),
    canvas,
    ambientLight: {
        intensity: 0
    },
    player: {
        onSkinLoad: () => console.log("SKIN LOADED!")
    },
    antialias: true,
    fxaa: true,
    ssaa: false,
    alpha: true,
    controls: true,
    shadows: true
});

loadModel(renderer, "scythe", "body");


function resize() {
    renderer.setSize(window.innerWidth - 40, window.innerHeight - 40);
}

window.addEventListener("resize", resize);
resize();




document.querySelector("#steve")?.addEventListener("click", () => renderer.player?.setSlim(false));
document.querySelector("#alex")?.addEventListener("click", () => renderer.player?.setSlim(true));
document.querySelector("#destroy")?.addEventListener("click", () => renderer.destroy(true));
document.querySelector("#remove-models")?.addEventListener("click", () => {
    if (renderer.player) {
        for (let model of renderer.player.getModels()) {
            renderer.player.removeModel(model);
        }
    }
});
document.querySelector("#chad-cape")?.addEventListener("click", () => renderer.player?.setCape("https://dev-assets.mantle.gg/cape/chad.png"));
document.querySelector("#glass-cape")?.addEventListener("click", () => renderer.player?.setCape("https://dev-assets.mantle.gg/cape/glass.png"));
document.querySelector("#screenshot")?.addEventListener("click", () => console.log(renderer.screenshot(1000, 1000, "png", 5)));



const backgroundMaterial = new ShadowMaterial();
backgroundMaterial.opacity = 0.3;

const backgroundGeometry = new BoxGeometry(1000, 1000, 0.1);
const backgroundMesh = new Mesh(backgroundGeometry, backgroundMaterial);
backgroundMesh.castShadow = true;
backgroundMesh.receiveShadow = true;
backgroundMesh.rotation.x = 1.2;
backgroundMesh.position.y = -25;
renderer.scene.add(backgroundMesh);


const pointLight = new DirectionalLight(0xffffff, 1.5);

pointLight.shadow.camera.left = -300;
pointLight.shadow.camera.right = 300;
pointLight.shadow.camera.top = 500;
pointLight.shadow.camera.bottom = -100;
pointLight.shadow.bias = -0.005;
pointLight.shadow.mapSize.width = 512;
pointLight.shadow.mapSize.height = 512;
pointLight.shadow.radius = 100;
pointLight.shadow.blurSamples = 25;

pointLight.position.set(0, 200, -200);
pointLight.castShadow = true;
pointLight.target.position.set(0, 0, -400);
renderer.scene.add(pointLight);

const playerMesh = renderer.player!.getMesh();
playerMesh.castShadow = true;
playerMesh.receiveShadow = true;

renderer.scene.traverse(child => {
    if (child.type == "Mesh") {
        child.castShadow = true;
    }
});
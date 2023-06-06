import './style.css'

import Renderer, { parseJavaBlockModel } from "../../src";
import ModelInfo from '../../src/interface/ModelInfo';

const canvas = document.createElement("canvas");
document.querySelector("#app")!.appendChild(canvas);




function loadModel(renderer: Renderer, id: string, bodyPart: string): Promise<ModelInfo> {
    return new Promise((resolve, reject) => {
        if (!renderer.player) return reject("Player isn't in scene");
        fetch(`https://dev-assets.mantle.gg/model/${id}.json`).then(r => r.json()).then(r => {
            if (!renderer.player) throw "Player isn't in scene";
            const model = parseJavaBlockModel(r, `https://dev-assets.mantle.gg/model/${id}.png`, [-8, 8, -8], renderer.player.getBodyPart(bodyPart)!);
            const outModel = renderer.player.addModel(model);
            resolve(outModel);
        });
    });
}



const renderer = new Renderer({
    live: true,
    canvas,
    ambientLight: {
        intensity: 0.03
    },
    player: {
        onSkinLoad: () => console.log("SKIN LOADED!")
    },
    antialias: false,
    fxaa: true,
    ssaa: false,
    alpha: true,
    controls: true
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
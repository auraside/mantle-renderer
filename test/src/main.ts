import './style.css'

import Renderer, { parseJavaBlockModel } from "../../src";

const canvas = document.createElement("canvas");
document.querySelector("#app")!.appendChild(canvas);

const renderer = new Renderer({
    canvas,
    ambientLight: {
        intensity: 0.03
    },
    antialias: false,
    slim: false,
    skin: "mhf_steve",
    fxaa: true,
    ssaa: false,
    alpha: true
});

(window as any).renderer = renderer;

function resize() {
    renderer.setSize(window.innerWidth - 40, window.innerHeight - 40);
}

window.addEventListener("resize", resize);
resize();


document.querySelector("#steve")?.addEventListener("click", () => renderer.player.setSlim(false));
document.querySelector("#alex")?.addEventListener("click", () => renderer.player.setSlim(true));

function loadHat(id: string) {
    fetch(`/${id}.json`).then(r => r.json()).then(r => {
        const model = parseJavaBlockModel(r, `/${id}.png`, renderer.player.getBodyPart("head")!, [-8, 8, -8]);
        renderer.player.addModel(model);
    });
}



loadHat("warden");
loadHat("cowboy");
// loadHat("axe");
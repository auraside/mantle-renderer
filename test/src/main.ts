import './style.css'

import Renderer from "../../src";

const canvas = document.createElement("canvas");
document.querySelector("#app")!.appendChild(canvas);

const renderer = new Renderer({
    canvas,
    ambientLight: {
        intensity: 0.03
    },
    antialias: true
});

function resize() {
    renderer.setSize(window.innerWidth - 40, window.innerHeight - 40);
}

window.addEventListener("resize", resize);
resize();
import Chalk from "chalk";
import MantleRenderer from "../../src/MantleRenderer.js";
import ModelInfo from "../../src/interface/ModelInfo.js";
import { parseJavaBlockModel } from "../../src/ModelUtils.js";

const CONCURRENT_RENDERERS = 10;
const TEST_DURATION_MINUTES = 10;

function loadModel(renderer: MantleRenderer, id: string, bodyPart: string): Promise<ModelInfo> {
    return new Promise((resolve, reject) => {
        if (!renderer.player) return reject("Player isn't in scene");
        fetch(`https://dev-assets.mantle.gg/model/${id}.json`).then(r => r.json()).then(r => {
            if (!renderer.player) return reject("Player isn't in scene");
            const model = parseJavaBlockModel(r, `https://dev-assets.mantle.gg/model/${id}.png`, [-8, 8, -8], renderer.player.getBodyPart(bodyPart)!);
            const outModel = renderer.player.addModel(model);
            resolve(outModel);
        }).catch(reject);
    });
}

let renderInstances = 0;

function createRenderer() {
    const renderer = new MantleRenderer({
        live: false,
        antialias: true,
        alpha: true,
        player: {
            onSkinLoad: async () => {
                await loadModel(renderer, "scythe", "body");
                
                renderer.screenshot(500, 500, "png", 5);
                renderer.destroy();
                renderInstances++;

                setTimeout(createRenderer);
            }
        }
    });
}

const startTime = Date.now();
console.log("Started memory leak test.");
console.log("Total duration: " + formatTime(TEST_DURATION_MINUTES * 60_000));
for (let i = 0; i < CONCURRENT_RENDERERS; i++) {
    createRenderer();
}

export function formatTime(time: number) {
    time /= 1000;
    let seconds: number | string = Math.floor(time);
    let minutes: number | string = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    let hours = Math.floor(minutes / 60);
    minutes -= hours * 60;

    if (seconds < 10) seconds = "0" + seconds;
    if (hours) {
        if (minutes < 10) minutes = "0" + minutes;
        return `${hours}:${minutes}:${seconds}`;
    }
    return `${minutes}:${seconds}`;
}


let totalMemoryDelta = 0;
let deltaIterations = 0;
let lastMemoryUsage: number | null = null;

setInterval(() => {
    const memoryUsage = process.memoryUsage().heapUsed;
    const mb = memoryUsage / 1_000_000;

    let delta: number | undefined;
    if (lastMemoryUsage == null) {
        lastMemoryUsage = mb;
    } else {
        delta = mb - lastMemoryUsage;
        lastMemoryUsage = mb;
        totalMemoryDelta += delta;
    }
    deltaIterations++;

    console.log("\n\n");
    console.log("Time running: " + formatTime(Date.now() - startTime));
    console.log("Times rendered: " + renderInstances);
    console.log("Memory used: " + (Math.round(mb * 100) / 100) + "MB");
    if (delta !== undefined) {
        console.log("Memory delta: " + (Math.round(delta * 100) / 100) + "MB");
    }
    
}, 5_000);

setTimeout(() => {
    console.log("\n\nMemory leak test concluded.");
    const deltaTotal = totalMemoryDelta / deltaIterations;

    console.log("Average memory delta: " + (Math.round(deltaTotal * 100) / 100) + "MB");
    if (deltaTotal < 0.5) {
        console.log(Chalk.greenBright("No memory leak detected."));
    } else {
        console.log(Chalk.redBright("Memory leak detected."));
    }
    console.log("\n\n");

    process.exit();
}, TEST_DURATION_MINUTES * 60_000);
import * as FS from "fs";
import * as Path from "path";
import MantleRenderer from "../src/Index.js";

const imagePath = Path.join("dev-server", "test.png");
try {
    FS.unlinkSync(imagePath);
} catch {}

const renderer = new MantleRenderer({
    live: false,
    ambientLight: {
        intensity: 0.5,
        color: 0xffffff
    },
    player: {
        onSkinLoad: () => {
            console.log("skin loaded!");
            renderer.render(0);
            const imageB64 = renderer.screenshot(1000, 1000, "png", 5);
            const image = imageB64.split(",", 2)[1];
            FS.writeFileSync(imagePath, Buffer.from(image, "base64"));
            console.log("Saved screenshot to 'test.png'");
        }
    },
    alpha: true,
    antialias: true,
    fxaa: true,
    bloom: {
        threshold: 0,
        strength: 3,
        radius: 1
    }
});
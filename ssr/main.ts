import * as FS from "fs";
import * as Path from "path";
import MantleRenderer from "../src/Index.js";

const imagePath = Path.join("ssr", "test.png");
try {
    FS.unlinkSync(imagePath);
} catch {}

const renderer = new MantleRenderer({
    live: false,
    ambientLight: {
        intensity: 0.03,
        color: 0xffffff
    },
    player: {
        onSkinLoad: () => {
            console.log("skin loaded!");
            renderer.render(0);
            const imageB64 = renderer.screenshot(700, 700);
            const image = imageB64.split(",", 2)[1];
            FS.writeFileSync(imagePath, Buffer.from(image, "base64"));
            console.log("Saved screenshot to 'test.png'");
        }
    },
    alpha: true,
    antialias: true,
    fxaa: true
});
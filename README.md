# <img src="https://github.com/auraside/mantle-renderer/raw/main/assets/Mantle%20Icon.svg" height=40 /> Mantle Renderer
A Minecraft-focused WebGL powered 3D renderer built for both the browser and server.

## Installation
Install Mantle Renderer into your client or server-side project using `npm i mantle-renderer`.


## Usage

### Creation
New renderers can be created attached to canvases. If used server-side, the `canvas` field should be omitted to let the renderer take care of it.
```ts
const renderer = new MantleRenderer({
    live: true,
    platformUtils: new ClientPlatformUtils(),
    canvas: canvasElement,
    player: {
        skin: "https://textures.minecraft.net/texture/7f608010686ff1d32c7323967ae9ee6599983b28f776a3b30f435a1e11822b9c",
        slim: false
    },
    antialias: true,
    fxaa: true,
    controls: true
});
```


### Deletion
Renderers need to manually be destroyed in order to free up memory used by textures and geometries.
```ts
renderer.destroy();
```


### Exporting Screenshots
Renderers allow the the scene to be exported as a PNG or JPEG at any resolution.
```ts
renderer.screenshot(1920, 1080, "jpeg", 2);
```
Post-Processing effects like FXAA, SSAA and bloom aren't supported by the screenshot method. Instead, super-sampling can be used as an alternative to anti-aliasing, at the cost of performance.

It should be noted that the screenshot method isn't very useful when used in the browser as you can [extract the contents of the HTML canvas](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL) directly, including post-processing effects.


### Loading Models
Minecraft: Java Edition block models can be converted to the Mantle Renderer format.
```ts
const blockModel = {...};
const textureUrl = "https://example.com/texture.png";

const mantleModel = parseJavaBlockModel(blockModel, textureUrl);
```
The model can then be imported directly into the scene. It's noted that using this technique, you'll need to dispose of the model's geometry, materials and textures yourself.
```ts
const mantleModel = parseJavaBlockModel(blockModel, textureUrl);

const { mesh } = await buildModel(mantleModel);

renderer.scene.add(mesh);
```

Alternatively, the model can be attached directly to a player model. Using this technique, the model's resources will automatically be released when the renderer is destroyed or the model is removed.
```ts
const mantleModel = parseJavaBlockModel(blockModel, textureUrl, [0, 0, 0], renderer.player.getBodyPart("head"));

await renderer.player.addModel(model);
```


## Using Headlessly
When using Mantle Renderer in a server environment you're likely using a headless machine. In this case, creating a render may result in the following error:
> THREE.WebGLRenderer: Error creating WebGL context.

This is because the machine isn't providing an X11 or an OpenGL environment. To setup this environment on Linux we can use [Xvfb](https://en.wikipedia.org/wiki/Xvfb) or [Mesa](https://docs.mesa3d.org).

If using Xvfb, its best to create the display environment as you start the Node.js application and close the environment when the application finishes. We can do that using this command:
```
xvfb-run -s "-ac -screen 0 1280x1024x24" <command to start Node.js application>
```
Read more about this in the [Headless GL documentation](https://github.com/stackgl/headless-gl#how-can-headless-gl-be-used-on-a-headless-linux-machine).

In order to not depend on a browser, the renderer's `platformUtils` needs to be adjusted.
```ts
const renderer = new MantleRenderer({
    live: false,
    platformUtils: new ServerPlatformUtils()
});
```


## Development Setup

run `npm run i` instead of `npm install` in order to download dependencies for both the library and the development environment.

## License
This project is [MIT licensed](https://github.com/auraside/mantle-renderer/blob/main/LICENSE).
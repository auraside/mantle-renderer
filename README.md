# <img src="./assets/Mantle%20Icon.svg" height=40 /> Mantle Renderer
A WebGL powered 3D renderer built for both the browser and server.

## Usage

### Creation
New renderers can be created attached to canvases. If used server-side, the `canvas` field should be ommited to let the renderer take care of it.
```ts
const renderer = new MantleRenderer({
    live: true,
    canvas: canvasElement,
    player: {
        skin: "EYE2AH",
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



## Development Setup

run `npm run i` instead of `npm install` in order to download dependencies for both the library and the dev environment

## License
This project is [MIT licensed](./LICENSE).
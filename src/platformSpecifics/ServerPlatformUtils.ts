import type GL from "gl";
import { Platform, BasePlatformUtils } from "./BasePlatformUtils.js";
import type Canvas from "canvas";
import { CanvasTexture } from "three";

export class ServerPlatformUtils extends BasePlatformUtils {
    constructor(
        private readonly gl: typeof GL,
        private readonly canvas: typeof Canvas
    ) {
        super();
    }

    getPlatform() {
        return Platform.SERVER;
    }

    create3dCanvas(width: number, height: number) {
        return {
            width,
            height,
            offsetWidth: width,
            offsetHeight: height,
            addEventListener: () => {},
            removeEventListener: () => {},
            getContext: (...params: any) => this.gl(width, height, {
                preserveDrawingBuffer: true
            })
        }
    }

    create2dCanvas(width: number, height: number) {
        return this.canvas.createCanvas(width, height);
    }

    getDevicePixelRatio() {
        return 1;
    }

    async createTexture(url: string | Canvas.Canvas) {
        if (typeof url == "string") {
            url = await this.urlToCanvas(url);
        }
        return new CanvasTexture(url as any);
    }

    urlToCanvas(url: string) {
        return new Promise<Canvas.Canvas>((resolve, reject) => {
            const image = new this.canvas.Image();
            
            image.onerror = reject;
            image.onload = () => {
                const canvas = this.canvas.createCanvas(image.width, image.height);
                canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height);
                
                resolve(canvas);
            }

            image.src = url;
        });
    }
}
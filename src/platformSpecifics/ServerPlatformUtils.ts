import GL from "gl";
import BasePlatformUtils, { Platform } from "./BasePlatformUtils.js";
import Canvas from "canvas";
import { CanvasTexture, Texture } from "three";

export default class ServerPlatformUtils extends BasePlatformUtils {
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
            getContext: (...params: any) => GL(width, height, {
                preserveDrawingBuffer: true
            })
        }
    }

    create2dCanvas(width: number, height: number) {
        return Canvas.createCanvas(width, height);
    }

    getDevicePixelRatio() {
        return 1;
    }

    async createTexture(url: string) {
        const canvas = await this.urlToCanvas(url);
        return new CanvasTexture(canvas as any);
    }

    urlToCanvas(url: string) {
        return new Promise<Canvas.Canvas>((resolve, reject) => {
            const image = new Canvas.Image();
            
            image.onerror = reject;
            image.onload = () => {
                const canvas = Canvas.createCanvas(image.width, image.height);
                canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height);
                
                resolve(canvas);
            }

            image.src = url;
        });
    }
}
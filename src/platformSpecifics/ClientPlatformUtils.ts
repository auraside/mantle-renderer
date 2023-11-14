import { CanvasTexture, TextureLoader } from "three";
import { Platform, BasePlatformUtils } from "./BasePlatformUtils.js";

export class ClientPlatformUtils extends BasePlatformUtils {
    getPlatform() {
        return Platform.CLIENT;
    }
    
    create3dCanvas(width: number, height: number) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    create2dCanvas(width: number, height: number) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    getDevicePixelRatio() {
        return window.devicePixelRatio;
    }

    async createTexture(url: string | HTMLCanvasElement) {
        if (typeof url == "string") {
            const texture = await new TextureLoader().loadAsync(url);
            return texture;
        } else {
            return new CanvasTexture(url);
        }
    }
    
    urlToCanvas(url: string) {
        return new Promise<HTMLCanvasElement>((resolve, reject) => {
            const image = new Image();
            image.crossOrigin = "anonymous";
            
            image.onerror = reject;
            image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                canvas.getContext("2d")!.drawImage(image, 0, 0, image.width, image.height);
                
                resolve(canvas);
            }

            image.src = url;
        });
    }
}
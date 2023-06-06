import { TextureLoader } from "three";
import BasePlatformUtils, { Platform } from "./BasePlatformUtils.js";

export default class ClientPlatformUtils extends BasePlatformUtils {
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

    async createTexture(url: string) {
        const texture = await new TextureLoader().loadAsync(url);
        return texture;
    }
}
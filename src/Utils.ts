export function stringToSkinUrl(string: string) {
    if (string.startsWith("./") || string.startsWith("../") || string.startsWith("/") || string.startsWith("http://") || string.startsWith("https://")) {
        return string;
    }
    return "https://api.cosmetica.cc/get/skin?user=" + string;
}
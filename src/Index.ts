import { MantleRenderer } from "./MantleRenderer.js"
export default MantleRenderer;

export * from "./ModelUtils.js"
export * from "./Utils.js"

export * from "./interface/DisposableObject.js"
export * from "./interface/GenericModel.js"
export * from "./interface/LightOptions.js"
export * from "./interface/ModelInfo.js"
export * from "./interface/ModelPartParent.js"
export * from "./interface/RendererOptions.js"

export * from "./model/ModelPart.js"
export * from "./model/PlayerModel.js"
export * from "./model/ElytraModel.js"
export * from "./model/CloakModel.js"

export { ServerPlatformUtils } from "./platformSpecifics/ServerPlatformUtils.js";
export { ClientPlatformUtils } from "./platformSpecifics/ClientPlatformUtils.js";
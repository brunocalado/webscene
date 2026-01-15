import { HTMLToScene, MODULE_ID, MODULE_NAME } from './htmltoscene.js';

/**
 * @module webscene.HTMLToSceneCompat
 */
class HTMLToSceneCompat {
    static checkModule(moduleId) {
        const module = game.modules.get(moduleId);
        return module?.active ?? false;
    }
}

/**
 * @module webscene.ModuleSettings
 */
class ModuleSettings {
    static registerSettings() {
        game.settings.register(MODULE_ID, 'showFoundryLogo', {
            name: "Show Foundry Logo",
            hint: "If enabled, the Foundry VTT logo will remain visible.",
            scope: 'world',
            config: true,
            default: !HTMLToSceneCompat.checkModule('minimal-ui'),
            type: Boolean,
        });
    }
}

/**
 * Hooks Registration
 */
Hooks.once('init', () => {
    ModuleSettings.registerSettings();
    HTMLToScene.init();
});

Hooks.on('canvasReady', () => HTMLToScene.replace());
Hooks.on('updateScene', () => HTMLToScene.replace());

Hooks.on('renderSceneConfig', (app, html, data) => {
    HTMLToScene.renderSceneConfig(app, html, data);
});

Hooks.on('htmlToSceneIFrameReady', () => HTMLToScene.passDataToIFrame());

console.log(`${MODULE_NAME} | Hooks Initialized`);
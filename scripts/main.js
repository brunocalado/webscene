import { HTMLToScene } from './htmltoscene.js';

/**
 * Contains information that is used in various parts of the module.
 * @class ModuleInfo
 */
class ModuleInfo {
	static moduleprefix = 'HTML to Scene | ';
	static moduleid = 'html-to-scene';
	static moduleapp = 'html-to-scene';
}

/**
 * @module html-to-scene.HTMLToSceneCompat
 */
class HTMLToSceneCompat {
	static checkModule(moduleId) {
		const module = game.modules.get(moduleId);
		return module?.active ?? false;
	}
}

/**
 * @module html-to-scene.ModuleSettings
 */
class ModuleSettings {
	static registerSettings() {
		const WORLD = 'world';

		game.settings.register(ModuleInfo.moduleid, 'showFoundryLogo', {
			name: "Show Foundry Logo",
			hint: "If enabled, the Foundry VTT logo will remain visible.",
			scope: WORLD,
			config: true,
			default: !HTMLToSceneCompat.checkModule('minimal-ui'),
			type: Boolean,
		});
	}
}

/**
 * @module html-to-scene.HTMLToSceneHooks
 */
class HTMLToSceneHooks {
	static hook() {
		// Initialize: Load templates
		Hooks.once('init', (...args) => HTMLToScene.init(...args));

		// Scene Rendering: Replace background
		Hooks.on('canvasReady', (...args) => HTMLToScene.replace(...args));
		Hooks.on('updateScene', (...args) => HTMLToScene.replace(...args));

		// Config Injection: Add tab to Scene Config
		Hooks.on('renderSceneConfig', (app, html, data) =>
			HTMLToScene.renderSceneConfig(app, html, data)
		);
		
		// IFrame Communication (Simplified: Automatic)
		Hooks.on('htmlToSceneIFrameReady', () => HTMLToScene.passDataToIFrame());
	}
}

/* Initialize Hooks */
HTMLToSceneHooks.hook();

export { ModuleInfo, ModuleSettings };
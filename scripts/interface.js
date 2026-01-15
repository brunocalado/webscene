import { HTMLToScene } from './htmltoscene.js';

/**
 * @module html-to-scene.Interface
 * Exposes essential Foundry VTT classes to the iframe window.
 * Revised to include only commonly used classes for HTML scenes.
 */
class FoundryVTTInterface {
	
	// Core Globals
	static get game() { return game; }
	static get canvas() { return canvas; }
	static get ui() { return ui; }
	static get Hooks() { return Hooks; }
	
	// Core Documents
	static get Actor() { return Actor; }
	static get Item() { return Item; }
	static get ChatMessage() { return ChatMessage; }
	static get Macro() { return Macro; }
	static get User() { return User; }
	static get Scene() { return Scene; }
	static get JournalEntry() { return JournalEntry; }
	static get Playlist() { return Playlist; }
	
	// Collections
	static get Actors() { return Actors; }
	static get Items() { return Items; }
	static get Scenes() { return Scenes; }
	static get Users() { return Users; }
	static get Macros() { return Macros; }
	
	// Dice
	static get Roll() { return Roll; }

	// Helpers
	static get AudioHelper() { return AudioHelper; }
	static get CONFIG() { return CONFIG; }

	/**
	 * HTML TO SCENE SPECIFIC
	 */
	static get iFrameReady() {
		Hooks.call('htmlToSceneIFrameReady', this);
	}
}

export { FoundryVTTInterface };
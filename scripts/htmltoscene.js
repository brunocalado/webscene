import { FoundryVTTInterface } from './interface.js';
import { ModuleInfo } from './main.js';

/**
 * HTML To Scene static class
 * Handles iframe injection and UI toggling.
 */
class HTMLToScene {
	static _iFrameNode;
    static _toggleBtn;
    static _uiHidden = false;

	/** Getters for Defaults */
	static get fileLocation() { return ''; }
	
    /** Flag Getters **/
	static get flags() {
		return canvas.scene?.flags?.htmltoscene ?? {};
	}

	static get enabled() { return Boolean(this.flags.enable); }
	static get fileLoc() { return String(this.flags.fileLoc ?? this.fileLocation); }

	static init(...args) {
		const loadTemplates = foundry.applications.handlebars.loadTemplates;
		loadTemplates(['modules/html-to-scene/templates/scenesettings.hbs']);
		console.log(ModuleInfo.moduleprefix + 'Loaded');
	}

    /**
     * Main function to handle scene replacement
     */
	static replace(...args) {
		// Clean up existing elements
        this.removeIframe();
        this.removeToggleBtn();

		if (!this.enabled || !this.fileLoc) {
			return;
		}

		console.log(ModuleInfo.moduleprefix + 'Activating HTML Scene...');

		// Create and insert iframe
		const iframe = this.createIframe();
        document.body.appendChild(iframe);
        
        // Create Floating UI Toggle Button
        this.createToggleBtn();

        // Pass Foundry API to iframe
        this.passDataToIFrame();
	}

	static removeIframe() {
		if (this._iFrameNode) {
			this._iFrameNode.remove();
			this._iFrameNode = null;
		}
	}

    /* --- FLOATING BUTTON & UI TOGGLE --- */

    static createToggleBtn() {
        const btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-eye"></i>';
        btn.title = "Toggle UI";
        btn.id = "htmltoscene-toggle-ui";
        
        // Styles for floating button (Bottom Right)
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '120px', // Above standard hotbar height usually
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: '2px solid #ff6400',
            zIndex: '1000', // Above almost everything
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px black'
        });

        btn.onclick = (e) => {
            e.preventDefault();
            this.toggleUI();
        };

        document.body.appendChild(btn);
        this._toggleBtn = btn;
        this._uiHidden = false; // Reset state
    }

    static removeToggleBtn() {
        if (this._toggleBtn) {
            this._toggleBtn.remove();
            this._toggleBtn = null;
        }
        // Ensure UI is restored if we leave the scene
        this.toggleUI(true); 
    }

    static toggleUI(forceShow = false) {
        const uiElements = [
            document.getElementById('ui-top'),
            document.getElementById('ui-left'),
            document.getElementById('ui-right'),
            document.getElementById('ui-bottom'),
            document.getElementById('hotbar')
        ];

        if (forceShow || this._uiHidden) {
            // Show UI
            uiElements.forEach(el => {
                if(el) el.style.display = '';
            });
            if(this._toggleBtn) this._toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            this._uiHidden = false;
        } else {
            // Hide UI
            uiElements.forEach(el => {
                if(el) el.style.display = 'none';
            });
            if(this._toggleBtn) this._toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            this._uiHidden = true;
        }
    }

    /* --- IFRAME CREATION --- */

	static createIframe() {
		let src = this.fileLoc;
		
        // Auto-fix URL protocol if missing
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/') && !src.startsWith('file:///')) {
			if (src.includes('.') && !src.endsWith('.html')) {
				src = 'https://' + src;
			}
		}

		const ifrm = document.createElement('iframe');
		ifrm.setAttribute('src', src);
		ifrm.setAttribute('id', ModuleInfo.moduleapp);
		
		ifrm.style.border = '0';
		ifrm.style.position = 'fixed';
		ifrm.style.left = '0';
		ifrm.style.top = '0';
		ifrm.style.width = '100vw';
		ifrm.style.height = '100vh';
        ifrm.style.backgroundColor = "black";
        ifrm.style.zIndex = '10'; // Above canvas, below UI
		
		this._iFrameNode = ifrm;
		return this._iFrameNode;
	}

    /* Data Passing */
	static passDataToIFrame() {
        if(!this._iFrameNode) return;
        
		try {
            if(this._iFrameNode.contentWindow) {
                this._iFrameNode.contentWindow.FoundryVTT = FoundryVTTInterface;
            }
        } catch (e) {}

        this._iFrameNode.addEventListener('load', () => {
             try {
                this._iFrameNode.contentWindow.FoundryVTT = FoundryVTTInterface;
                Hooks.call('htmlToSceneReady', this);
            } catch (e) {}
        });
	}

    /* --- SCENE CONFIGURATION INJECTION --- */

	static async renderSceneConfig(app, html, data) {
		let ui = html;
		if (typeof jQuery !== 'undefined' && (ui instanceof jQuery || ui.jquery)) {
			ui = ui[0];
		}

        const nav = ui.querySelector('nav.sheet-tabs');
        if (!nav) return;

        // 1. Add Tab Button
        if (nav.querySelector('[data-tab="htmltoscene"]')) return;

        const newTab = document.createElement('a');
        newTab.className = 'item';
        newTab.dataset.tab = 'htmltoscene';
        newTab.innerHTML = `<i class="fas fa-desktop"></i> HTML`;
        nav.appendChild(newTab);

        // 2. Prepare Data & Render
        const flags = app.document.flags?.htmltoscene || {};
        const templateData = {
            enable: flags.enable ?? false,
            fileLoc: flags.fileLoc ?? ''
        };

        const renderTemplate = foundry.applications.handlebars.renderTemplate;
        const contentHtml = await renderTemplate('modules/html-to-scene/templates/scenesettings.hbs', templateData);

        // 3. Inject Content Correctly
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentHtml;
        const contentDiv = tempDiv.firstElementChild;

        const existingTab = ui.querySelector('.tab[data-tab]');
        if (existingTab) {
            existingTab.parentNode.insertBefore(contentDiv, existingTab.nextSibling);
        } else {
            // Fallback: look for sheet-body or form
            const body = ui.querySelector('.sheet-body') || ui.querySelector('form');
            if (body) {
                // If appending to form, try to insert before the footer/submit button
                const footer = body.querySelector('footer, button[type="submit"]');
                if (footer) {
                    body.insertBefore(contentDiv, footer);
                } else {
                    body.appendChild(contentDiv);
                }
            }
        }

        // 4. Tab Click Handling
        newTab.addEventListener('click', (ev) => {
            ev.preventDefault();
            
            // Nav State
            nav.querySelectorAll('.item').forEach(el => el.classList.remove('active'));
            newTab.classList.add('active');

            // Content State
            // We need to find the parent container of our contentDiv to hide siblings
            const container = contentDiv.parentElement;
            container.querySelectorAll('.tab').forEach(el => {
                el.classList.remove('active');
                el.style.display = 'none';
            });

            contentDiv.classList.add('active');
            contentDiv.style.display = 'block';

            if(app.setPosition) app.setPosition({height: "auto"});
        });

        // Other Tabs Handling
        nav.querySelectorAll('.item:not([data-tab="htmltoscene"])').forEach(otherTab => {
            otherTab.addEventListener('click', () => {
                newTab.classList.remove('active');
                contentDiv.classList.remove('active');
                contentDiv.style.display = 'none';
            });
        });
	}
}

export { HTMLToScene };
import { FoundryVTTInterface } from './interface.js';

/* --- CONSTANTS --- */
// ATENÇÃO: Deve ser idêntico ao "id" no module.json e ao nome da pasta
export const MODULE_ID = 'webscene'; 
export const MODULE_NAME = 'Web Scene';

export const TEMPLATES = {
    SCENE_SETTINGS: `modules/${MODULE_ID}/templates/scenesettings.hbs`
};

export const FLAGS = {
    ENABLE: 'enable',
    FILE_LOC: 'fileLoc'
};

/**
 * HTML To Scene static class
 * Handles iframe injection and UI toggling.
 */
export class HTMLToScene {
    static _iFrameNode;
    static _toggleBtn;
    static _uiHidden = false;

    /** Getters for Defaults */
    static get fileLocation() { return ''; }

    /** Flag Getters **/
    static get flags() {
        return canvas.scene?.flags?.[MODULE_ID] ?? {};
    }

    static get enabled() { return Boolean(this.flags[FLAGS.ENABLE]); }
    static get fileLoc() { return String(this.flags[FLAGS.FILE_LOC] ?? this.fileLocation); }

    static init() {
        const loadTemplates = foundry.applications.handlebars.loadTemplates;
        loadTemplates([TEMPLATES.SCENE_SETTINGS]);
        console.log(`${MODULE_NAME} | Loaded`);
    }

    /**
     * Main function to handle scene replacement
     */
    static replace() {
        // Clean up existing elements
        this.removeIframe();
        this.removeToggleBtn();

        // Check conditions
        if (!canvas.scene || !this.enabled || !this.fileLoc) {
            return;
        }

        console.log(`${MODULE_NAME} | Activating HTML Scene...`);

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
        btn.id = `${MODULE_ID}-toggle-ui`;

        // Styles for floating button
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '120px',
            right: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            border: '2px solid #ff6400',
            zIndex: '1000',
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
            uiElements.forEach(el => { if (el) el.style.display = ''; });
            if (this._toggleBtn) this._toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            this._uiHidden = false;
        } else {
            uiElements.forEach(el => { if (el) el.style.display = 'none'; });
            if (this._toggleBtn) this._toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            this._uiHidden = true;
        }
    }

    /* --- IFRAME CREATION --- */

    static createIframe() {
        let src = this.fileLoc;

        // Auto-fix URL
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/') && !src.startsWith('file:///')) {
            if (src.includes('.') && !src.endsWith('.html')) {
                src = 'https://' + src;
            }
        }

        const ifrm = document.createElement('iframe');
        ifrm.setAttribute('src', src);
        ifrm.setAttribute('id', `${MODULE_ID}-iframe`);

        Object.assign(ifrm.style, {
            border: '0',
            position: 'fixed',
            left: '0',
            top: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: "black",
            zIndex: '10'
        });

        this._iFrameNode = ifrm;
        return this._iFrameNode;
    }

    static passDataToIFrame() {
        if (!this._iFrameNode) return;

        try {
            if (this._iFrameNode.contentWindow) {
                this._iFrameNode.contentWindow.FoundryVTT = FoundryVTTInterface;
            }
        } catch (e) { }

        this._iFrameNode.addEventListener('load', () => {
            try {
                this._iFrameNode.contentWindow.FoundryVTT = FoundryVTTInterface;
                Hooks.call('htmlToSceneReady', this);
            } catch (e) { }
        });
    }

    /* --- SCENE CONFIG --- */

    static async renderSceneConfig(app, html, data) {
        // V13 HTMLElement support
        const ui = (html instanceof HTMLElement) ? html : html[0];
        const nav = ui.querySelector('nav.sheet-tabs');
        if (!nav) return;

        if (nav.querySelector(`[data-tab="${MODULE_ID}"]`)) return;

        // Add Tab
        const newTab = document.createElement('a');
        newTab.className = 'item';
        newTab.dataset.tab = MODULE_ID;
        newTab.innerHTML = `<i class="fas fa-desktop"></i> HTML`;
        nav.appendChild(newTab);

        // Render Content
        const flags = app.document.flags?.[MODULE_ID] || {};
        const templateData = {
            // Passamos o module ID para o template usar nos nomes dos inputs
            moduleId: MODULE_ID, 
            enable: flags[FLAGS.ENABLE] ?? false,
            fileLoc: flags[FLAGS.FILE_LOC] ?? ''
        };

        const contentHtml = await foundry.applications.handlebars.renderTemplate(TEMPLATES.SCENE_SETTINGS, templateData);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = contentHtml;
        const contentDiv = tempDiv.firstElementChild;

        // Insert Content
        const existingTab = ui.querySelector('.tab[data-tab]');
        if (existingTab) {
            existingTab.parentNode.insertBefore(contentDiv, existingTab.nextSibling);
        } else {
            const body = ui.querySelector('.sheet-body') || ui.querySelector('form');
            if (body) body.appendChild(contentDiv);
        }

        // Click Handler
        newTab.addEventListener('click', (ev) => {
            ev.preventDefault();
            nav.querySelectorAll('.item').forEach(el => el.classList.remove('active'));
            const container = contentDiv.parentElement;
            container.querySelectorAll('.tab').forEach(el => {
                el.classList.remove('active');
                el.style.display = 'none';
            });
            newTab.classList.add('active');
            contentDiv.classList.add('active');
            contentDiv.style.display = 'block';
            if (app.setPosition) app.setPosition({ height: "auto" });
        });

        nav.querySelectorAll(`.item:not([data-tab="${MODULE_ID}"])`).forEach(otherTab => {
            otherTab.addEventListener('click', () => {
                newTab.classList.remove('active');
                contentDiv.classList.remove('active');
                contentDiv.style.display = 'none';
            });
        });
    }
}
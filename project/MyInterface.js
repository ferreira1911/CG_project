import { CGFinterface, dat } from '../lib/CGF.js';

/**
* MyInterface
* @constructor
*/
export class MyInterface extends CGFinterface {
    constructor() {
        super();
    }

    init(application) {
        super.init(application);

        this.gui = new dat.GUI();
        
        // 1. Global Scene (Initially active)
        const globalFolder = this.gui.addFolder('Global Scene');
        globalFolder.add(this.scene, 'displaySky').name('Sky / Panorama');
        globalFolder.add(this.scene, 'displayTerrain').name('Terrain');
        globalFolder.add(this.scene, 'displayGrass').name('Grass');
        globalFolder.open();

        // 2. World Elements (Initially inactive)
        const gameFolder = this.gui.addFolder('World Elements');
        gameFolder.add(this.scene, 'displayWagon').name('Wagon & Horses');
        gameFolder.add(this.scene, 'displayFlora').name('Flowers / Flora');
        gameFolder.add(this.scene, 'displayRocks').name('Rocks');
        gameFolder.add(this.scene, 'displayHayBales').name('Hay Bales');

        // 3. Dynamic Grass Config (Sliders)
        const grassFolder = this.gui.addFolder('Grass Parameters');
        grassFolder.add(this.scene, 'windAmp', 0.0, 1.0, 0.01).name('Wind Strength');
        grassFolder.add(this.scene, 'windFreq', 0.1, 5.0, 0.1).name('Wind Frequency');
        grassFolder.open();

        // 4. Debug Tools
        const debugFolder = this.gui.addFolder('Tools & Debug');
        debugFolder.add(this.scene, 'displayAxis').name('Display Axis');
        debugFolder.add(this.scene, 'displayHUD').name('Display HUD (HP)');
        debugFolder.add(this.scene, 'displayArrows').name('Direction Arrows');
        debugFolder.add(this.scene, 'freeCamera').name('Free Camera');

        this.initKeys();

        return true;
    }

    // Keyboard state tracking
    initKeys() {
        this.scene.gui = this.gui;
        this.scene.interface = this;  
        this.processKeyboard = function () {};
        this.activeKeys = {};
    }

    processKeyDown(event) {
        this.activeKeys[event.code] = true;
    }

    processKeyUp(event) {
        this.activeKeys[event.code] = false;
    }

    // Returns true while the key is held down.
    isKeyPressed(code) {
        return this.activeKeys[code] === true;
    }
}


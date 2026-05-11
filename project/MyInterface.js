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
        const visFolder = this.gui.addFolder('Visibility');
        visFolder.add(this.scene, 'displayAxis').name('Display Axis');
        visFolder.add(this.scene, 'displayHUD').name('Display HUD');
        visFolder.add(this.scene, 'displayWagon').name('Display Wagon');
        visFolder.add(this.scene, 'displayFlora').name('Display Flora');
        visFolder.add(this.scene, 'displayArrows').name('Display Arrows');
        visFolder.add(this.scene, 'displayRocks').name('Display Rocks');
        visFolder.add(this.scene, 'displayHayBales').name('Display Hay Bales');
        visFolder.add(this.scene, 'displayGrass').name('Display Grass');
        visFolder.open();

        this.gui.add(this.scene, 'freeCamera').name('Free Camera');

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


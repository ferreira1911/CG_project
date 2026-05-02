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
        this.gui.add(this.scene, 'displayAxis').name('Display Axis');
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


import {CGFinterface, dat} from '../lib/CGF.js';

/**
* MyInterface
* @constructor
*/
export class MyInterface extends CGFinterface {
    constructor() {
        super();
    }

    init(application) {
        // call CGFinterface init
        super.init(application);
        
        // init GUI. For more information on the methods, check:
        // https://github.com/dataarts/dat.gui/blob/master/API.md
        this.gui = new dat.GUI();

        //Checkbox element in GUI
        this.gui.add(this.scene, 'displayAxis').name('Display Axis');

        //Slider element in GUI
        this.gui.add(this.scene, 'scaleFactor', 0.1, 5).name('Scale Factor');
        this.gui.add(this.scene, 'translateX', -10, 10).name('Translate X');
        this.gui.add(this.scene, 'translateY', -10, 10).name('Translate Y');
        this.gui.add(this.scene, 'translateZ', -10, 10).name('Translate Z');
        this.gui.add(this.scene, 'rotateX', 0, 360).name('Rotate X');
        this.gui.add(this.scene, 'rotateY', 0, 360).name('Rotate Y');
        this.gui.add(this.scene, 'rotateZ', 0, 360).name('Rotate Z');

        return true;
    }
}
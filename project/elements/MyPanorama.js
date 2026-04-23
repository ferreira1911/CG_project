import { CGFobject, CGFappearance } from '../../lib/CGF.js';
import { MySphere } from '../geometric/MySphere.js';

export class MyPanorama extends CGFobject {
    constructor(scene, texture) {
        super(scene);
        this.sphere = new MySphere(scene, 200, 128, 64, true, 1, 0);

        this.appearance = new CGFappearance(scene);
        this.appearance.setEmission(1, 1, 1, 1);
        this.appearance.setTexture(texture);

    }

    display() {
        this.scene.pushMatrix();

        const cam = this.scene.camera.position;
        //this.scene.translate(cam[0], cam[1], cam[2]);

        this.appearance.apply();
        this.sphere.display();

        this.scene.popMatrix();
    }
}

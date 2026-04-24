import { CGFobject } from '../../lib/CGF.js';
import { MySphere } from '../geometric/MySphere.js';

export class MyRock extends CGFobject {
    constructor(scene, x, y, z, scale, seed, deform) {
        super(scene);
        this.sphere = new MySphere(scene, 0.5, 32, 16, false, 1, 0);
        this.x = x;
        this.y = y;
        this.z = z;
        this.scale = scale;
        this.seed = seed;
        this.deform = deform;
    }

    display() {
        // Set rock shader uniforms for this instance
        this.scene.rockShader.setUniformsValues({
            uSeed: this.seed,
            uDeformScale: this.deform
        });

        this.scene.pushMatrix();
        this.scene.translate(this.x, this.y, this.z);
        this.scene.scale(this.scale, this.scale, this.scale);
        this.sphere.display();
        this.scene.popMatrix();
    }
}

import { CGFobject, CGFappearance, CGFshader, CGFtexture } from '../../lib/CGF.js';
import { MyPlane } from '../geometric/MyPlane.js';

export class MyTerrain extends CGFobject {
    constructor(scene) {
        super(scene);
        
        // 50 divisões (50x50 quadrados).
        this.plane = new MyPlane(scene, 50); 
        
        this.initMaterials();
    }

    initMaterials() {
        this.appearance = new CGFappearance(this.scene);

        this.appearance.setTextureWrap('REPEAT', 'REPEAT');
    }

    display() {
        this.scene.pushMatrix();

        this.appearance.apply();

        this.scene.scale(60, 1, 60);

        this.plane.display();

        this.scene.popMatrix();
    }
}
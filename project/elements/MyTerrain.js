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
        this.colorMap = new CGFtexture(this.scene, "resources/textures/terrain_color.jpg");
        this.heightMap = new CGFtexture(this.scene, "resources/textures/terrain_height.jpg");

        this.appearance = new CGFappearance(this.scene);
        this.appearance.setAmbient(0.3, 0.3, 0.3, 1);
        this.appearance.setDiffuse(0.7, 0.7, 0.7, 1);
        this.appearance.setSpecular(0.0, 0.0, 0.0, 1);
        this.appearance.setShininess(1);

        this.appearance.setTexture(this.colorMap);
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
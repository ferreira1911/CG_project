import { CGFobject } from '../../lib/CGF.js';
import { MyTriangle } from '../geometric/MyTriangle.js';

/**
 * MyArrow
 * A custom 2D arrow geometry (head + tail) that points down.
 * Used with arrowShader for bobbing, spinning, and pulsing effects.
 */
export class MyArrow extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [
            // Front face (normals = +Z)
            0.0,  0.0, 0,  // 0: Tip (bottom)
            0.5,  0.8, 0,  // 1: Head Right
           -0.5,  0.8, 0,  // 2: Head Left
            0.2,  0.8, 0,  // 3: Shaft Bottom Right
           -0.2,  0.8, 0,  // 4: Shaft Bottom Left
            0.2,  1.8, 0,  // 5: Shaft Top Right
           -0.2,  1.8, 0,  // 6: Shaft Top Left

            // Back face (normals = -Z)
            0.0,  0.0, 0,  // 7: Tip (bottom)
            0.5,  0.8, 0,  // 8: Head Right
           -0.5,  0.8, 0,  // 9: Head Left
            0.2,  0.8, 0,  // 10: Shaft Bottom Right
           -0.2,  0.8, 0,  // 11: Shaft Bottom Left
            0.2,  1.8, 0,  // 12: Shaft Top Right
           -0.2,  1.8, 0   // 13: Shaft Top Left
        ];

        this.normals = [
            // Front
            0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1,
            // Back
            0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1
        ];

        this.indices = [
            // Front Head
            0, 1, 2,
            // Front Shaft (two triangles making a quad)
            3, 5, 4,
            4, 5, 6,

            // Back Head
            7, 9, 8,
            // Back Shaft
            10, 11, 12,
            11, 13, 12
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    display() {
        this.scene.pushMatrix();
        // Scale down to a reasonable size
        this.scene.scale(0.8, 0.8, 0.8); 
        super.display();
        this.scene.popMatrix();
    }
}

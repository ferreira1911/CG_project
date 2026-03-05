import {CGFobject} from '../../lib/CGF.js';
/**
 * MyQuad
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyQuad extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [
            -0.5, -0.5, 0,  // 0: Bottom-Left
            0.5, -0.5, 0,   // 1: Bottom-Right
            0.5, 0.5, 0,    // 2: Top-Right
            -0.5, 0.5, 0,   // 3: Top-Left
        ];

        this.indices = [
           0, 1, 3,
           3, 1, 2 
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}


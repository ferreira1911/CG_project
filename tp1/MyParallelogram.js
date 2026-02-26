import {CGFobject} from '../../lib/CGF.js';
/**
 * Mytriangle
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyParallelogram extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [
            0,0,0, //0
            1,0,0, //1
            1,1,0, //2
            2,1,0, //3
            2,0,0, //4
            3,1,0  //5
        ];

        this.indices = [
           // --- FRONT (Counter-Clockwise) ---
            0, 1, 2,
            1, 3, 2,
            1, 4, 3,
            4, 5, 3,

            // --- BACK (Clockwise from the front, CCW from the back) ---
            0, 2, 1,
            1, 2, 3,
            1, 3, 4,
            4, 3, 5
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}


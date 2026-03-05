import {CGFobject} from '../lib/CGF.js';
/**
 * MyDiamond
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyUnitCube extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [
            -0.5, -0.5,  0.5,   // 0: Bottom-Left-Front
             0.5, -0.5,  0.5,   // 1: Bottom-Right-Front
             0.5,  0.5,  0.5,   // 2: Top-Right-Front
            -0.5,  0.5,  0.5,   // 3: Top-Left-Front

             0.5, -0.5, -0.5,   // 4: Bottom-Right-Back
            -0.5, -0.5, -0.5,   // 5: Bottom-Left-Back
            -0.5,  0.5, -0.5,   // 6: Top-Left-Back
             0.5,  0.5, -0.5    // 7: Top-Right-Back
        ];

        //Counter-clockwise reference of vertices
        this.indices = [
            0,1,2,   // front
            0,2,3,
        
            1,4,7,  //right
            1,7,2,

            5,0,3, //left
            5,3,6,

            4,5,6, //back
            4,6,7,

            2,7,6,//top
            2,6,3,

            1,0,5, // bottom
            1,5,4
        ];

        //The defined indices (and corresponding vertices)
        //will be read in groups of three to draw triangles
        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}


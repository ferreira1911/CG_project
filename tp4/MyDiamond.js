import {CGFobject} from '../lib/CGF.js';

/**
 * MyDiamond
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyDiamond extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [
            // Face Z+ (Frontal)
            -1, 0, 0,   // 0
             0,-1, 0,   // 1
             0, 1, 0,   // 2
             1, 0, 0,   // 3 

            // Face Z- (Traseira)
            -1, 0, 0,   // 4
             0,-1, 0,   // 5
             0, 1, 0,   // 6
             1, 0, 0    // 7
        ];

        this.normals = [
            // Vetores normais da Face Z+
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            // Vetores normais da Face Z-
            0, 0,-1,
            0, 0,-1,
            0, 0,-1,
            0, 0,-1
        ];

        this.indices = [
            // Polígonos da Face Z+ (Orientação Counter-Clockwise)
            0, 1, 2,
            1, 3, 2, 

            // Polígonos da Face Z- (Orientação Counter-Clockwise relativa ao referencial traseiro)
            4, 6, 5,
            5, 6, 7
        ];

        this.texCoords = [
            0, 0.5,
            0.25, 0.75,
            0.25,0.25,
            0.5,0.5,
            0, 0.5,
            0.25, 0.75,
            0.25,0.25,
            0.5,0.5
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}
import {CGFobject} from '../../lib/CGF.js';

/**
 * MyParallelogram
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
            // Face Z+ (Frente)
            0, 0, 0, // 0
            1, 0, 0, // 1
            1, 1, 0, // 2
            2, 1, 0, // 3
            2, 0, 0, // 4
            3, 1, 0, // 5

            // Face Z- (Trás)
            0, 0, 0, // 6
            1, 0, 0, // 7
            1, 1, 0, // 8
            2, 1, 0, // 9
            2, 0, 0, // 10
            3, 1, 0  // 11
        ];

        this.normals = [
            // Vetores normais da Face Z+ (0 a 5)
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            // Vetores normais da Face Z- (6 a 11)
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1
        ];

        this.indices = [
            // Polígonos da Face Z+ (Counter-Clockwise)
            0, 1, 2,
            1, 3, 2,
            1, 4, 3,
            4, 5, 3,

            // Polígonos da Face Z- (Counter-Clockwise relativo ao referencial traseiro)
            6, 8, 7,
            7, 8, 9,
            7, 9, 10,
            10, 9, 11
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}
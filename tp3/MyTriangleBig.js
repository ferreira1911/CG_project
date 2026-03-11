import {CGFobject} from '../../lib/CGF.js';

/**
 * MyTriangleBig
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyTriangleBig extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    
    initBuffers() {
        // Vértices duplicados: 4 para a face frontal (Z+) e 4 para a face traseira (Z-)
        this.vertices = [
            // Face Z+ (Frente)
            -2, 0, 0, // 0
             0, 0, 0, // 1
             0, 2, 0, // 2
             2, 0, 0, // 3

            // Face Z- (Trás)
            -2, 0, 0, // 4
             0, 0, 0, // 5
             0, 2, 0, // 6
             2, 0, 0  // 7
        ];

        // Definição dos vetores normais perpendiculares a cada plano
        this.normals = [
            // Normais da face Z+ 
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            // Normais da face Z- 
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1
        ];

        this.indices = [
            // Face Z+ 
            0, 1, 2,
            1, 3, 2,

            // Face Z- 
            4, 6, 5, // Equivalente a inverter a ordem 4, 5, 6
            5, 6, 7  // Equivalente a inverter a ordem 5, 7, 6
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}
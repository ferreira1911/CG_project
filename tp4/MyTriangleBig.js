import { CGFobject } from '../../lib/CGF.js';

/**
 * MyTriangleBig
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyTriangleBig extends CGFobject {
    constructor(scene, texCoords) {
        super(scene);
        this.texCoords = texCoords;
        this.initBuffers();
    }
    
    initBuffers() {
        // Apenas 3 vértices por face (Esquerda, Direita, Topo)
        this.vertices = [
            // Face Z+ (Frente)
            -2, 0, 0, // 0: Esquerda
             2, 0, 0, // 1: Direita
             0, 2, 0, // 2: Topo

            // Face Z- (Trás)
            -2, 0, 0, // 3: Esquerda
             2, 0, 0, // 4: Direita
             0, 2, 0  // 5: Topo
        ];

        this.indices = [
            // Face Z+ (Sentido anti-horário) - ambas as orientações para visibilidade de ambos os lados
            0, 1, 2,
            0, 2, 1,

            // Face Z- (ambas as orientações)
            3, 5, 4,
            3, 4, 5
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}
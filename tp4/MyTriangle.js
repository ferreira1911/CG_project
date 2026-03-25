import {CGFobject} from '../../lib/CGF.js';
/**
 * MyTriangle
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyTriangle extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [
            // Face da Frente
            -1,  1, 0,  // 0: Cima-Esquerda
            -1, -1, 0,  // 1: Baixo-Esquerda
             1, -1, 0,  // 2: Baixo-Direita

            // Face de Trás 
            -1,  1, 0,  // 3: Cima-Esquerda
            -1, -1, 0,  // 4: Baixo-Esquerda
             1, -1, 0   // 5: Baixo-Direita
        ];

        this.normals = [
            // Normais da face da frente 
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            // Normais da face de trás 
            0, 0, -1,
            0, 0, -1,
            0, 0, -1
        ];

        this.indices = [
            // Face da frente (Sentido anti-horário)
            0, 1, 2,

            // Face de trás 
            3, 5, 4 
        ];

        this.texCoords = [
            0,0.5,
            0,1,
            0.5,1,
            0,0.5,
            0,1,
            0.5,1
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}
import {CGFobject} from '../lib/CGF.js';
/**
 * MyUnitCube
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyUnitCube extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    
    initBuffers() {
        // Agrupamos 4 vértices por cada face (6 faces * 4 = 24 vértices)
        this.vertices = [
            // Front face (+Z)
            -0.5, -0.5,  0.5,  // 0
             0.5, -0.5,  0.5,  // 1
             0.5,  0.5,  0.5,  // 2
            -0.5,  0.5,  0.5,  // 3

            // Back face (-Z)
             0.5, -0.5, -0.5,  // 4
            -0.5, -0.5, -0.5,  // 5
            -0.5,  0.5, -0.5,  // 6
             0.5,  0.5, -0.5,  // 7

            // Right face (+X)
             0.5, -0.5,  0.5,  // 8
             0.5, -0.5, -0.5,  // 9
             0.5,  0.5, -0.5,  // 10
             0.5,  0.5,  0.5,  // 11

            // Left face (-X)
            -0.5, -0.5, -0.5,  // 12
            -0.5, -0.5,  0.5,  // 13
            -0.5,  0.5,  0.5,  // 14
            -0.5,  0.5, -0.5,  // 15

            // Top face (+Y)
            -0.5,  0.5,  0.5,  // 16
             0.5,  0.5,  0.5,  // 17
             0.5,  0.5, -0.5,  // 18
            -0.5,  0.5, -0.5,  // 19

            // Bottom face (-Y)
            -0.5, -0.5, -0.5,  // 20
             0.5, -0.5, -0.5,  // 21
             0.5, -0.5,  0.5,  // 22
            -0.5, -0.5,  0.5   // 23
        ];

        // As normais são perpendiculares a cada face
        this.normals = [
            // Front face (aponta para a frente, eixo Z positivo)
            0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,

            // Back face (aponta para trás, eixo Z negativo)
            0, 0, -1,  0, 0, -1,  0, 0, -1,  0, 0, -1,

            // Right face (aponta para a direita, eixo X positivo)
            1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,

            // Left face (aponta para a esquerda, eixo X negativo)
            -1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,

            // Top face (aponta para cima, eixo Y positivo)
            0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,

            // Bottom face (aponta para baixo, eixo Y negativo)
            0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0
        ];

        // Índices divididos para usar todos os 24 vértices, face a face
        this.indices = [
            0, 1, 2,        0, 2, 3,        // Front
            4, 5, 6,        4, 6, 7,        // Back
            8, 9, 10,       8, 10, 11,      // Right
            12, 13, 14,     12, 14, 15,     // Left
            16, 17, 18,     16, 18, 19,     // Top
            20, 21, 22,     20, 22, 23      // Bottom
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}
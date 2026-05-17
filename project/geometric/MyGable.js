import { CGFobject } from '../../lib/CGF.js';

export class MyGable extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [
            // Front face
            -0.5, 0, 0,  // Bottom-Left
             0.5, 0, 0,  // Bottom-Right
             0.0, 1, 0,  // Top-Center

            // Back face
            -0.5, 0, 0,
             0.5, 0, 0,
             0.0, 1, 0
        ];

        this.normals = [
            // Front
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            // Back
            0, 0, -1,
            0, 0, -1,
            0, 0, -1
        ];

        this.texCoords = [
            // Front
            0, 1,
            1, 1,
            0.5, 0,
            // Back
            0, 1,
            1, 1,
            0.5, 0
        ];

        this.indices = [
            // Front
            0, 1, 2,
            // Back (reversed)
            3, 5, 4
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }
}

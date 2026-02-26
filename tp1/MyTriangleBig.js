import {CGFobject} from '../../lib/CGF.js';
/**
 * Mytriangle
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyTriangleBig extends CGFobject {
    constructor(scene) {
        super(scene);
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [
            -2,0,0,//0
            0,0,0,//1
            0,2,0,//2
            2,0,0//3
        ];

        this.indices = [
          0,1,2,
          1,3,2,

          0,2,1,
          1,2,3
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}


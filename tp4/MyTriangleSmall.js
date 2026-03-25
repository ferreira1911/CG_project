import {CGFobject} from '../../lib/CGF.js';
/**
 * Mytriangle
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyTriangleSmall extends CGFobject {
    constructor(scene, textCoords) {
        super(scene);
        this.texCoords = textCoords;
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [
            -1,0,0, //0
             1,0,0,
             0,1,0
        ];

        this.indices = [
           0,1,2,
           0,2,1
        ];

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}


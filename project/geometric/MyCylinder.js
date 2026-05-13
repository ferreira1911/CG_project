import { CGFobject } from '../../lib/CGF.js';
/**
 * MyCylinder
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyCylinder extends CGFobject {
    constructor(scene, slices, stacks) {
        super(scene);
        this.slices = slices;
        this.stacks = stacks;
        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];
        this.texCoords = [];

        var ang = 0;
        var alphaAng = 2 * Math.PI / this.slices;
        var stackHeight = 1.0 / this.stacks;
        let index = 0;

        // Generate vertices and normals
        for (var s = 0; s <= this.stacks; s++) {
            var y = s * stackHeight; // <-- Height now grows UP along the Y axis
            var ang = 0;

            for (var i = 0; i <= this.slices; i++) {
                var x = Math.cos(ang);
                var z = Math.sin(ang); // <-- Z completes the circular base

                this.vertices.push(x, y, z);

                this.normals.push(x, 0, z);

                this.texCoords.push(i / this.slices, 1 - y);

                ang += alphaAng;
            }
        }

        // Generate indices
        for (var s = 0; s < this.stacks; s++) {
            for (var i = 0; i < this.slices; i++) {

                var current = (s * (this.slices + 1)) + i;
                var next = current + 1;
                var top = current + (this.slices + 1);
                var topNext = top + 1;

                this.indices.push(current, next, top);
                this.indices.push(next, topNext, top);
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}


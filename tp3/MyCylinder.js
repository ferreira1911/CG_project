import {CGFobject} from '../../lib/CGF.js';
/**
 * MyCylinder
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyCylinder extends CGFobject {
    constructor(scene, slices, stacks)
    {
        super(scene);      
        this.slices = slices;      
        this.stacks = stacks;
        this.initBuffers();
    }
    
    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];

        var ang = 0;
        var alphaAng = 2*Math.PI/this.slices;
        var stackHeight = 1.0 / this.stacks;
        let index =0;

        // Generate vertices and normals
        for (var s = 0; s <= this.stacks; s++) {
            var z = s * stackHeight;
            var ang = 0;

            for (var i = 0; i <= this.slices; i++) {
                var x = Math.cos(ang);
                var y = Math.sin(ang);

                this.vertices.push(x, y, z);
                this.normals.push(x, y, 0);

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


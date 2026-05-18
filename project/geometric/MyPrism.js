import {CGFobject} from '../../lib/CGF.js';
/**
 * MyQuad
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyPrism extends CGFobject {
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
        this.texCoords = []; // Added texture coordinates array

        var ang = 0;
        var alphaAng = 2*Math.PI/this.slices;
        var stackHeight = 1.0 / this.stacks;
        let index =0;
        for (var i = 0; i < this.slices; i++ ){

            var sa=Math.sin(ang);
            var saa=Math.sin(ang+alphaAng);
            var ca=Math.cos(ang);
            var caa=Math.cos(ang+alphaAng);

            var normalAngle = ang + alphaAng/2;
            var nx = Math.cos(normalAngle);
            var ny = Math.sin(normalAngle);
            var nz = 0;

            for (var s =0; s < this.stacks ; s++){
                var zbase = s*stackHeight;
                var ztop = (s+1)*stackHeight;

                // need to create 4 vertices
                this.vertices.push(ca,sa,zbase);   //bottom right
                this.vertices.push(caa,saa,zbase)  // bottom left
                this.vertices.push(ca,sa,ztop);   //top right
                this.vertices.push(caa,saa,ztop); // top left
                
                // Texture coordinates mapped around the prism (U) and along the stacks (V)
                var uBase = i / this.slices;
                var uNext = (i + 1) / this.slices;
                var vBase = s / this.stacks;
                var vTop = (s + 1) / this.stacks;

                this.texCoords.push(uBase, vBase);    // bottom right
                this.texCoords.push(uNext, vBase);    // bottom left
                this.texCoords.push(uBase, vTop);     // top right
                this.texCoords.push(uNext, vTop);     // top left
                
                for (var j =0; j < 4; j++){
                    this.normals.push(nx,ny,nz);
                }

                this.indices.push(index, (index+1) , (index+2) );
                this.indices.push(( index+ 1), (index+3) , (index+2) );
                index += 4;
            }

            ang += alphaAng;
        }

        this.primitiveType = this.scene.gl.TRIANGLES;

        this.initGLBuffers();
    }
}


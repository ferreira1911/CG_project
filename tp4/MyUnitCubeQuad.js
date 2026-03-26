import {CGFobject, CGFappearance} from '../lib/CGF.js';
import { MyQuad } from './MyQuad.js';

/**
 * MyUnitCubeQuad
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyUnitCubeQuad extends CGFobject {
    constructor(scene, topTexture, frontTexture, rightTexture, backTexture, leftTexture, baseTexture) {
        super(scene);

        this.topTexture = topTexture;
        this.frontTexture = frontTexture;
        this.rightTexture = rightTexture;
        this.backTexture = backTexture;
        this.leftTexture = leftTexture;
        this.baseTexture = baseTexture;

        this.quad = new MyQuad(scene);
        
        // Create a default material for the cube faces
        this.material = new CGFappearance(scene);
        this.material.setAmbient(0.8, 0.8, 0.8, 1);
        this.material.setDiffuse(0.8, 0.8, 0.8, 1);
        this.material.setSpecular(0.1, 0.1, 0.1, 1);
        this.material.setShininess(10.0);
    }
    
    display(){
        // front
        this.scene.pushMatrix();
        this.scene.translate(0,0,0.5);
        this.material.setTexture(this.frontTexture);
        this.material.apply();
        this.quad.display();
        this.scene.popMatrix();

        // right
        this.scene.pushMatrix();
        this.scene.translate(0.5,0,0);
        this.scene.rotate(90*Math.PI / 180, 0, 1, 0);
        this.material.setTexture(this.rightTexture);
        this.material.apply();
        this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_MAG_FILTER, this.scene.gl.NEAREST);
        this.quad.display();
        this.scene.popMatrix();

        // left
        this.scene.pushMatrix();
        this.scene.translate(-0.5,0,0);
        this.scene.rotate(-90*Math.PI / 180, 0, 1, 0);
        this.material.setTexture(this.leftTexture);
        this.material.apply();
        this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_MAG_FILTER, this.scene.gl.NEAREST);
        this.quad.display();
        this.scene.popMatrix();

        // back
        this.scene.pushMatrix();
        this.scene.translate(0,0,-0.5);
        this.scene.rotate(180*Math.PI / 180, 0, 1, 0);
        this.material.setTexture(this.backTexture);
        this.material.apply();
        this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_MAG_FILTER, this.scene.gl.NEAREST);
        this.quad.display();
        this.scene.popMatrix();

        // top
        this.scene.pushMatrix();
        this.scene.translate(0,0.5,0);
        this.scene.rotate(-90*Math.PI / 180, 1, 0, 0);
        this.material.setTexture(this.topTexture);
        this.material.apply();
        this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_MAG_FILTER, this.scene.gl.NEAREST);
        this.quad.display();
        this.scene.popMatrix();

        // bottom
        this.scene.pushMatrix();
        this.scene.translate(0,-0.5,0);
        this.scene.rotate(90*Math.PI / 180, 1, 0, 0);
        this.material.setTexture(this.baseTexture);
        this.material.apply();
        this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_MAG_FILTER, this.scene.gl.NEAREST);
        this.quad.display();
        this.scene.popMatrix();
    }
}


import {CGFobject} from '../lib/CGF.js';
import { MyDiamond } from './MyDiamond.js';
import { MyParallelogram } from './MyParallelogram.js';
import { MyTriangle } from './MyTriangle.js';
import { MyTriangleSmall } from './MyTriangleSmall.js';
import { MyTriangleBig } from './MyTriangleBig.js';
/**
 * MyDiamond
 * @constructor
 * @param scene - Reference to MyScene object
 */
export class MyTangram extends CGFobject {
    constructor(scene) {
        super(scene);
        this.diamond = new MyDiamond(scene);
        this.triangle1 = new MyTriangle(scene);
        this.triangleSmall = new MyTriangleSmall(scene);
        this.parallelogram = new MyParallelogram(scene);
        this.triangleBig1 = new MyTriangleBig(scene);
        this.triangleBig2 = new MyTriangleBig(scene);
    }
    
    display(){
        // green diamond
        this.scene.pushMatrix();
        let trans = [
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            1.0, 8.1, 0, 1
        ];
        this.scene.multMatrix(trans);
        this.scene.rotate(45*Math.PI / 180,0,0,1);
        this.scene.setDiffuse(0/255, 255/255, 0/255,0);
        this.diamond.display();
        this.scene.popMatrix();

        // big blue triangle
        this.scene.pushMatrix();
        this.scene.translate(-1.1,6.7,0);
        this.scene.scale(1,-1,1);
        this.scene.rotate(-45*Math.PI / 180,0,0,1);
        
        this.scene.setDiffuse(0.25, 0.6, 1,0);
        this.triangleBig1.display();
        this.scene.popMatrix();

        // big yellow triangle
        this.scene.pushMatrix();
        this.scene.translate(-1.1,3.9,0);
        this.scene.scale(1,1,1);
        this.scene.rotate(45*Math.PI / 180,0,0,1);
        
        this.scene.setDiffuse(1, 0.6, 0,0);
        this.triangleBig2.display();
        this.scene.popMatrix();

        // pink triangle

        this.scene.pushMatrix();
        this.scene.translate(-1.1,2.5,0);
        this.scene.rotate(-45*Math.PI / 180,0,0,1);
        
        this.scene.setDiffuse(1, 0.7, 0.8,0);
        this.triangle1.display();
        this.scene.popMatrix();

        // yellow parallelogram

        this.scene.pushMatrix();
        this.scene.translate(-1.1,3.9,0);
        this.scene.scale(1,-1,1);
        this.scene.rotate(45*Math.PI / 180,0,0,1);
        
        this.scene.setDiffuse(1, 1, 0, 0);
        this.parallelogram.display();
        this.scene.popMatrix();

        // red triangle
        this.scene.pushMatrix();
        this.scene.translate(-0.7,0.7,0);
        this.scene.scale(1,-1,1);
        this.scene.rotate(45*Math.PI / 180,0,0,1);
        
        this.scene.setDiffuse(1, 0, 0, 0);
        this.triangleSmall.display();
        this.scene.popMatrix();

        // purple triangle
        this.scene.pushMatrix();
        this.scene.translate(1.05,0.7,0);
        this.scene.scale(1,-1,1);
        this.scene.rotate(45*Math.PI / 180,0,0,1);
        
        this.scene.setDiffuse(0.5, 0, 0.5, 0);
        this.triangleSmall.display();
        this.scene.popMatrix();
    }
}


import {CGFappearance, CGFobject} from '../lib/CGF.js';
import { MyDiamond } from './MyDiamond.js';
import { MyParallelogram } from './MyParallelogram.js';
import { MyTriangle } from './MyTriangle.js';
import { MyTriangleSmall } from './MyTriangleSmall.js';
import { MyTriangleBig } from './MyTriangleBig.js';

export class MyTangram extends CGFobject {
    constructor(scene) {
        super(scene);
        this.diamond = new MyDiamond(scene);
        this.triangle1 = new MyTriangle(scene);
        this.triangleSmall = new MyTriangleSmall(scene);
        this.parallelogram = new MyParallelogram(scene);
        this.triangleBig1 = new MyTriangleBig(scene);
        this.triangleBig2 = new MyTriangleBig(scene);
        
        this.initMaterials();
    }

    initMaterials() {
        this.materialDiamond = new CGFappearance(this.scene);
        this.materialDiamond.setAmbient(0, 1, 0, 1.0);
        this.materialDiamond.setDiffuse(0, 1, 0, 1.0);
        this.materialDiamond.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.materialDiamond.setShininess(10.0);

        this.materialTriangleBlue = new CGFappearance(this.scene);
        this.materialTriangleBlue.setAmbient(0.25, 0.6, 1, 1.0);
        this.materialTriangleBlue.setDiffuse(0.25, 0.6, 1, 1.0);
        this.materialTriangleBlue.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.materialTriangleBlue.setShininess(10.0);

        this.materialTriangleOrange = new CGFappearance(this.scene);
        this.materialTriangleOrange.setAmbient(1, 0.6, 0, 1.0);
        this.materialTriangleOrange.setDiffuse(1, 0.6, 0, 1.0);
        this.materialTriangleOrange.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.materialTriangleOrange.setShininess(10.0);

        this.materialTrianglePink = new CGFappearance(this.scene);
        this.materialTrianglePink.setAmbient(1, 0.7, 0.8, 1.0);
        this.materialTrianglePink.setDiffuse(1, 0.7, 0.8, 1.0);
        this.materialTrianglePink.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.materialTrianglePink.setShininess(10.0);

        this.materialParallelogram = new CGFappearance(this.scene);
        this.materialParallelogram.setAmbient(1, 1, 0, 1.0);
        this.materialParallelogram.setDiffuse(1, 1, 0, 1.0);
        this.materialParallelogram.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.materialParallelogram.setShininess(10.0);

        this.materialTriangleRed = new CGFappearance(this.scene);
        this.materialTriangleRed.setAmbient(1, 0, 0, 1.0);
        this.materialTriangleRed.setDiffuse(1, 0, 0, 1.0);
        this.materialTriangleRed.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.materialTriangleRed.setShininess(10.0);

        this.materialTrianglePurple = new CGFappearance(this.scene);
        this.materialTrianglePurple.setAmbient(0.5, 0, 0.5, 1.0);
        this.materialTrianglePurple.setDiffuse(0.5, 0, 0.5, 1.0);
        this.materialTrianglePurple.setSpecular(0.9, 0.9, 0.9, 1.0);
        this.materialTrianglePurple.setShininess(10.0);
    }
    
    display() {
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
        this.scene.customMaterial.apply();
        this.diamond.display();
        this.scene.popMatrix();

        // big blue triangle
        this.scene.pushMatrix();
        this.scene.translate(-1.1,6.7,0);
        this.scene.scale(1,-1,1);
        this.scene.rotate(-45*Math.PI / 180,0,0,1);
        this.materialTriangleBlue.apply();
        this.triangleBig1.display();
        this.scene.popMatrix();

        // big orange triangle
        this.scene.pushMatrix();
        this.scene.translate(-1.1,3.9,0);
        this.scene.scale(1,1,1);
        this.scene.rotate(45*Math.PI / 180,0,0,1);
        this.materialTriangleOrange.apply();
        this.triangleBig2.display();
        this.scene.popMatrix();

        // pink triangle
        this.scene.pushMatrix();
        this.scene.translate(-1.1,2.5,0);
        this.scene.rotate(-45*Math.PI / 180,0,0,1);
        this.materialTrianglePink.apply();
        this.triangle1.display();
        this.scene.popMatrix();

        // yellow parallelogram
        this.scene.pushMatrix();
        this.scene.translate(-1.1,3.9,0);
        this.scene.scale(1,-1,1);
        this.scene.rotate(45*Math.PI / 180,0,0,1);
        this.materialParallelogram.apply();
        this.parallelogram.display();
        this.scene.popMatrix();

        // red triangle
        this.scene.pushMatrix();
        this.scene.translate(-0.7,0.7,0);
        this.scene.scale(1,-1,1);
        this.scene.rotate(45*Math.PI / 180,0,0,1);
        this.materialTriangleRed.apply();
        this.triangleSmall.display();
        this.scene.popMatrix();

        // purple triangle
        this.scene.pushMatrix();
        this.scene.translate(1.05,0.7,0);
        this.scene.scale(1,-1,1);
        this.scene.rotate(45*Math.PI / 180,0,0,1);
        this.materialTrianglePurple.apply();
        this.triangleSmall.display();
        this.scene.popMatrix();
    }
}
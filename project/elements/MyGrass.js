import {CGFobject, CGFappearance} from '../lib/CGF.js';
import { MyQuad } from './MyQuad.js';

export class MyGrass extends CGFobject {
    constructor(scene, texture,x,y,z) {
        super(scene);
        this.quad = new MyQuad(scene);
        this.appearance = new CGFappearance(scene);
    }

    display() {
        this.scene.pushMatrix();
        this.scene.popMatrix();
    }
}

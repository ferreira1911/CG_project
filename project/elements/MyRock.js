import { CGFobject } from '../../lib/CGF.js';
import { MySphere } from '../geometric/MySphere.js';

export class MyRock extends CGFobject {
    constructor(scene, x, y, z, sx, sy, sz, rotY, seed, deform,
                bigFreq, detailFreq, detailWeight, topBias, colorTex, normalTex) {
        super(scene);
        this.sphere = new MySphere(scene, 0.5, 16, 8, false, 1, 0);
        this.x = x;
        this.y = y;
        this.z = z;
        this.sx = sx;
        this.sy = sy;
        this.sz = sz;
        this.rotY = rotY;
        this.seed = seed;
        this.deform = deform;
        this.bigFreq = bigFreq;
        this.detailFreq = detailFreq;
        this.detailWeight = detailWeight;
        this.topBias = topBias;
        this.colorTex = colorTex;
        this.normalTex = normalTex;
    }

    display() {
        this.scene.rockShader.setUniformsValues({
            uSeed: this.seed,
            uDeformScale: this.deform,
            uBigFreq: this.bigFreq,
            uDetailFreq: this.detailFreq,
            uDetailWeight: this.detailWeight,
            uTopBias: this.topBias
        });

        this.colorTex.bind(0);
        this.normalTex.bind(1);

        this.scene.pushMatrix();
        this.scene.translate(this.x, this.y, this.z);
        this.scene.rotate(this.rotY, 0, 1, 0);
        this.scene.scale(this.sx, this.sy, this.sz);
        this.sphere.display();
        this.scene.popMatrix();
    }
}

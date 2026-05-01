import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const THICKNESS = 0.12;

// Long thin pole extending forward from the bed.
export class MyWagonTongue extends CGFobject {
  constructor(scene, length, texture) {
    super(scene);
    this.length = length;

    this.appearance = new CGFappearance(scene);
    this.appearance.setAmbient(0.30, 0.25, 0.20, 1.0);
    this.appearance.setDiffuse(0.55, 0.40, 0.28, 1.0);
    this.appearance.setSpecular(0.10, 0.10, 0.10, 1.0);
    this.appearance.setShininess(5.0);
    if (texture) {
      this.appearance.setTexture(texture);
      this.appearance.setTextureWrap('REPEAT', 'REPEAT');
    }
  }

  display() {
    this.appearance.apply();

    const L = this.length;
    this.scene.pushMatrix();
    // Anchor at the back end so the pole extends along +x.
    this.scene.translate(L / 2, 0, 0);
    this.scene.scale(L, THICKNESS, THICKNESS);
    this.scene.cube.display();
    this.scene.popMatrix();
  }
}

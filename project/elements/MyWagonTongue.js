import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const THICKNESS = 0.12;

// Pole extending forward from the bed + a crossbar (whippletree) at the tip
// that the horse harnesses to.
export class MyWagonTongue extends CGFobject {
  constructor(scene, length, texture) {
    super(scene);
    this.length = length;

    // Near-white diffuse lets the wood texture supply its own colour.
    this.appearance = new CGFappearance(scene);
    this.appearance.setAmbient(0.40, 0.40, 0.40, 1.0);
    this.appearance.setDiffuse(0.90, 0.90, 0.90, 1.0);
    this.appearance.setSpecular(0.05, 0.05, 0.05, 1.0);
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
    // Anchor at the back end so the pole extends along +X.
    this.scene.translate(L / 2, 0, 0);
    this.scene.scale(L, THICKNESS, THICKNESS);
    this.scene.cube.display();
    this.scene.popMatrix();

    // Whippletree crossbar at the front tip.
    this.scene.pushMatrix();
    this.scene.translate(L - 0.2, 0, 0);
    this.scene.scale(0.1, 0.1, 1.8);
    this.scene.cube.display();
    this.scene.popMatrix();
  }
}

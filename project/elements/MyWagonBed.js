import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const RAIL_THICKNESS = 0.08;
const RAIL_HEIGHT_FACTOR = 1.2;

// Wooden bed = a flat floor cube + two side rails along its length.
// The wagon's local frame here has +x forward, +y up, +z to the side.
export class MyWagonBed extends CGFobject {
  constructor(scene, length, width, height, texture) {
    super(scene);
    this.length = length;
    this.width  = width;
    this.height = height;

    // Near-white so the wood texture comes through with its own colour.
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

    const L = this.length, W = this.width, H = this.height;
    const railH = H * RAIL_HEIGHT_FACTOR;
    const cube = this.scene.cube;

    // Floor of the bed.
    this.scene.pushMatrix();
    this.scene.scale(L, H, W);
    cube.display();
    this.scene.popMatrix();

    // Two side rails sitting on top of the floor, flush with each long edge.
    for (const sign of [1, -1]) {
      this.scene.pushMatrix();
      this.scene.translate(0, H / 2 + railH / 2, sign * (W / 2 - RAIL_THICKNESS / 2));
      this.scene.scale(L, railH, RAIL_THICKNESS);
      cube.display();
      this.scene.popMatrix();
    }
  }
}

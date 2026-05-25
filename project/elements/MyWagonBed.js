import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const RAIL_THICKNESS     = 0.08;
const RAIL_HEIGHT_FACTOR = 1.2;  // duplicated in MyWagon.RAIL_HEIGHT — keep in sync

// Bed = floor cube + two side rails. Local frame: +X forward, +Y up, +Z right.
// Back half of each rail is a solid wall; front half is open posts + 3 horizontal
// planks so the driver bench is visible through it.
export class MyWagonBed extends CGFobject {
  constructor(scene, length, width, height, texture) {
    super(scene);
    this.length = length;
    this.width  = width;
    this.height = height;

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
    const L = this.length, W = this.width, H = this.height;
    const railH = H * RAIL_HEIGHT_FACTOR;
    const cube = this.scene.cube;

    // Bed floor.
    this.scene.pushMatrix();
    this.scene.scale(L, H, W);
    cube.display();
    this.scene.popMatrix();

    this._displayRails(L, H, railH, cube);
    this._displayDriverArea(L, H, W, cube);
  }

  _displayRails(L, H, railH, cube) {
    const postW = 0.2, postH = railH, postD = RAIL_THICKNESS;

    for (const sign of [1, -1]) {
      const zOffset = sign * (this.width / 2 - postD / 2);

      // Back-half rail: solid wall.
      this.scene.pushMatrix();
      this.scene.translate(-L / 4, H / 2 + railH / 2, zOffset);
      this.scene.scale(L / 2, railH, postD);
      cube.display();
      this.scene.popMatrix();

      // Front-half rail: 3 vertical posts + 3 horizontal planks.
      const frontPostXs = [postW / 2, L / 4, L / 2 - postW / 2];
      for (const px of frontPostXs) {
        this.scene.pushMatrix();
        this.scene.translate(px, H / 2 + postH / 2, zOffset);
        this.scene.scale(postW, postH, postD);
        cube.display();
        this.scene.popMatrix();
      }

      const plankH  = 0.2;
      const plankYs = [H / 2 + railH * 0.2, H / 2 + railH * 0.5, H / 2 + railH * 0.8];
      for (const py of plankYs) {
        this.scene.pushMatrix();
        // Push planks slightly outward so they sit flush against the post faces.
        this.scene.translate(L / 4, py, zOffset + sign * (postD / 2 + 0.02));
        this.scene.scale(L / 2, plankH, 0.04);
        cube.display();
        this.scene.popMatrix();
      }
    }
  }

  _displayDriverArea(L, H, W, cube) {
    // Bench seat.
    this.scene.pushMatrix();
    this.scene.translate(L/2 - 1.0, H/2 + 0.6, 0);
    this.scene.scale(0.8, 0.1, W - 0.4);
    cube.display();
    this.scene.popMatrix();

    // Bench backrest, angled back ~22.5°.
    this.scene.pushMatrix();
    this.scene.translate(L/2 - 1.45, H/2 + 0.9, 0);
    this.scene.rotate(-Math.PI / 8, 0, 0, 1);
    this.scene.scale(0.1, 0.6, W - 0.4);
    cube.display();
    this.scene.popMatrix();

    // Footrest board.
    this.scene.pushMatrix();
    this.scene.translate(L/2 - 0.3, H/2 + 0.1, 0);
    this.scene.scale(0.8, 0.05, W - 0.4);
    cube.display();
    this.scene.popMatrix();

    // Brake lever, slanted back so it reads as hand-operated.
    this.scene.pushMatrix();
    this.scene.translate(L/2 - 0.9, H/2 + 0.5, -W/2 + 0.2);
    this.scene.rotate(-Math.PI / 6, 0, 0, 1);
    this.scene.scale(0.08, 1.2, 0.08);
    cube.display();
    this.scene.popMatrix();

    // Side step: two vertical hangers + a horizontal step board on +Z.
    for (const dx of [-0.3, 0.3]) {
      this.scene.pushMatrix();
      this.scene.translate(L/4 + dx, H/2 - 0.3, W/2 + 0.02);
      this.scene.scale(0.05, 0.6, 0.05);
      cube.display();
      this.scene.popMatrix();
    }
    this.scene.pushMatrix();
    this.scene.translate(L/4, H/2 - 0.5, W/2 + 0.1);
    this.scene.scale(0.8, 0.05, 0.2);
    cube.display();
    this.scene.popMatrix();
  }
}

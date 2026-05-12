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

    // Structural Side Rails
    const postW = 0.2, postH = railH, postD = RAIL_THICKNESS;
    // 4 posts along the length
    const postXs = [-L/2 + postW/2, -L/6, L/6, L/2 - postW/2];
    
    for (const sign of [1, -1]) {
      const zOffset = sign * (W / 2 - postD / 2);
      
      // Vertical Posts
      for (const px of postXs) {
        this.scene.pushMatrix();
        this.scene.translate(px, H / 2 + postH / 2, zOffset);
        this.scene.scale(postW, postH, postD);
        cube.display();
        this.scene.popMatrix();
      }
      
      // Horizontal Planks (3 per side)
      const plankH = 0.2;
      const plankYs = [H / 2 + railH * 0.2, H / 2 + railH * 0.5, H / 2 + railH * 0.8];
      for (const py of plankYs) {
        this.scene.pushMatrix();
        // Shift slightly outwards to sit flush against the posts
        this.scene.translate(0, py, zOffset + sign * (postD / 2 + 0.02));
        this.scene.scale(L, plankH, 0.04);
        cube.display();
        this.scene.popMatrix();
      }
    }

    // Rear Tailgate
    const tgX = -L/2 + 0.05;
    const tgYs = [H/2 + railH * 0.25, H/2 + railH * 0.65];
    for (const py of tgYs) {
      this.scene.pushMatrix();
      this.scene.translate(tgX, py, 0);
      this.scene.scale(0.1, 0.3, W - RAIL_THICKNESS * 2);
      cube.display();
      this.scene.popMatrix();
    }

    // Front Driver's Area
    // 1. Bench Seat
    this.scene.pushMatrix();
    this.scene.translate(L/2 - 1.0, H/2 + 0.6, 0);
    this.scene.scale(0.8, 0.1, W - 0.4);
    cube.display();
    this.scene.popMatrix();

    // 2. Bench Backrest (Angled)
    this.scene.pushMatrix();
    this.scene.translate(L/2 - 1.45, H/2 + 0.9, 0);
    this.scene.rotate(-Math.PI / 8, 0, 0, 1);
    this.scene.scale(0.1, 0.6, W - 0.4);
    cube.display();
    this.scene.popMatrix();

    // 3. Footrest Board
    this.scene.pushMatrix();
    this.scene.translate(L/2 - 0.3, H/2 + 0.1, 0);
    this.scene.scale(0.8, 0.05, W - 0.4);
    cube.display();
    this.scene.popMatrix();
  }
}

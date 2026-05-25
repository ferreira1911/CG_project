import { CGFobject } from '../../lib/CGF.js';

const LENGTH = 2.2;
const WIDTH  = 1.3;
const HEIGHT = 1.3;

// Rectangular bale at world (x, y, z). Geometry is the scene's shared unit
// cube scaled at draw time so every bale shares one VBO.
//
// States:
//   isPickedUp=false                              → drawn at ground position
//   isPickedUp=true, no active dropAnimator       → drawn on the wagon bed
//   isPickedUp=true, dropAnimator.active          → drawn falling from bed to ground
export class MyHayBale extends CGFobject {
  constructor(scene, x, y, z, rotY = 0, scale = 1.0, material = null) {
    super(scene);
    this.x = x; this.y = y; this.z = z;
    this.rotY  = rotY;
    this.scale = scale;

    // Material is shared by MyScene — allocating per-bale appearances mid-game
    // caused a frame stutter on respawn.
    this.mat = material;

    this.groundY = y;
    this.renderY = y;
    this.isPickedUp   = false;
    this.dropAnimator = null;

    this.LENGTH = LENGTH;
    this.WIDTH  = WIDTH;
    this.HEIGHT = HEIGHT;
    this.RADIUS = HEIGHT * 0.5;
  }

  // Anchor for the floating arrow above this bale.
  getTopCenter() {
    return [this.x, this.y + this.HEIGHT * this.scale + 0.5, this.z];
  }

  // Apply material + scale the shared cube to bale dimensions. Caller handles
  // translate/rotate so this draws cleanly in either world or wagon-local space.
  drawMesh() {
    const s = this.scene;
    this.mat.apply();
    s.pushMatrix();
    s.scale(this.LENGTH, this.HEIGHT, this.WIDTH);
    s.cube.display();
    s.popMatrix();
  }

  display() {
    const s = this.scene;
    s.pushMatrix();
    s.translate(this.x, this.renderY + this.HEIGHT * 0.5 * this.scale, this.z);
    s.rotate(this.rotY, 0, 1, 0);
    s.scale(this.scale, this.scale, this.scale);
    this.drawMesh();
    s.popMatrix();
  }
}

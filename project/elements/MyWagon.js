import { CGFobject } from '../../lib/CGF.js';
import { MyWagonBed }    from './MyWagonBed.js';
import { MyWagonCover }  from './MyWagonCover.js';
import { MyWagonTongue } from './MyWagonTongue.js';
import { MyWagonWheel }  from './MyWagonWheel.js';
import { MyHorse }       from './MyHorse.js';

const BED_LENGTH         = 8.0;
const BED_WIDTH          = 4.0;
const BED_HEIGHT         = 0.9;
// Duplicates MyWagonBed.RAIL_HEIGHT_FACTOR — keep in sync. Used here so the
// cover can rest on top of the rails instead of cutting through them.
const RAIL_HEIGHT        = BED_HEIGHT * 1.2;
const FRONT_WHEEL_RADIUS = 0.85;
const BACK_WHEEL_RADIUS  = 1.20;
const WHEEL_THICKNESS    = 0.22;
const TONGUE_LENGTH      = 4.5;

// Hierarchical covered light wagon: bed, cloth cover (back half), front tongue,
// 4 wheels (back pair larger), and the horses harnessed at the tongue tip.
export class MyWagon extends CGFobject {
  constructor(scene, x, y, z, yaw, scale, horseTexture) {
    super(scene);
    this.x = x; this.y = y; this.z = z;
    this.yaw = yaw;
    this.scale = scale;

    this.bed        = new MyWagonBed(scene, BED_LENGTH, BED_WIDTH, BED_HEIGHT);
    this.cover      = new MyWagonCover(scene, BED_LENGTH * 0.5, BED_WIDTH * 0.5);
    this.tongue     = new MyWagonTongue(scene, TONGUE_LENGTH);
    this.frontWheel = new MyWagonWheel(scene, FRONT_WHEEL_RADIUS, WHEEL_THICKNESS);
    this.backWheel  = new MyWagonWheel(scene, BACK_WHEEL_RADIUS,  WHEEL_THICKNESS);

    // Horses live in world coordinates: place them at the tip of the tongue,
    // rotated to match the wagon's yaw so they "pull" it forward (+x local).
    const fwdDist = (BED_LENGTH * 0.5 + TONGUE_LENGTH) * scale;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const hx = x + cy * fwdDist;
    const hz = z - sy * fwdDist;
    const horseScale = 0.02 * scale;
    // Horse model's local forward is +z, so add π/2 so it aligns with the
    // wagon's +x forward direction.
    this.horses = [
      new MyHorse(scene, hx, y, hz, horseScale, yaw + Math.PI / 2, horseTexture),
    ];
  }

  display() {
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.rotate(this.yaw, 0, 1, 0);
    this.scene.scale(this.scale, this.scale, this.scale);

    // Bed centred above the back axle (back wheels set the bed height).
    this.scene.pushMatrix();
    this.scene.translate(0, BACK_WHEEL_RADIUS + BED_HEIGHT * 0.5, 0);
    this.bed.display();
    this.scene.popMatrix();

    // Cover sits on top of the side rails so the canvas wraps over them.
    this.scene.pushMatrix();
    this.scene.translate(-BED_LENGTH * 0.25, BACK_WHEEL_RADIUS + BED_HEIGHT + RAIL_HEIGHT, 0);
    this.cover.display();
    this.scene.popMatrix();

    // Tongue extends forward from the front of the bed at front-axle height.
    this.scene.pushMatrix();
    this.scene.translate(BED_LENGTH * 0.5, FRONT_WHEEL_RADIUS, 0);
    this.tongue.display();
    this.scene.popMatrix();

    // 4 wheels: front pair smaller, back pair larger. Each pair sits at its
    // own radius so both touch the ground.
    const wx = BED_LENGTH * 0.35;
    const wz = BED_WIDTH  * 0.5 + WHEEL_THICKNESS * 0.5 + 0.02;
    const wheelPlacements = [
      [ wx,  wz, this.frontWheel, FRONT_WHEEL_RADIUS],
      [ wx, -wz, this.frontWheel, FRONT_WHEEL_RADIUS],
      [-wx,  wz, this.backWheel,  BACK_WHEEL_RADIUS],
      [-wx, -wz, this.backWheel,  BACK_WHEEL_RADIUS],
    ];
    for (const [px, pz, wheel, radius] of wheelPlacements) {
      this.scene.pushMatrix();
      this.scene.translate(px, radius, pz);
      wheel.display();
      this.scene.popMatrix();
    }

    this.scene.popMatrix();

    // Horses use world transforms, so draw them outside the wagon's matrix.
    for (const h of this.horses) h.display();
  }
}

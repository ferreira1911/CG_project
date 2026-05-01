import { CGFobject } from '../../lib/CGF.js';
import { MyWagonBed }    from './MyWagonBed.js';
import { MyWagonCover }  from './MyWagonCover.js';
import { MyWagonTongue } from './MyWagonTongue.js';
import { MyWagonWheel }  from './MyWagonWheel.js';
import { MyHorse }       from './MyHorse.js';

const BED_LENGTH    = 4.0;
const BED_WIDTH     = 2.0;
const BED_HEIGHT    = 0.6;
const WHEEL_RADIUS  = 0.7;
const TONGUE_LENGTH = 3.0;

// Hierarchical covered light wagon: bed, cloth cover (back half), front tongue,
// 4 wheels, and the horses harnessed at the end of the tongue.
export class MyWagon extends CGFobject {
  constructor(scene, x, y, z, yaw, scale, horseTexture) {
    super(scene);
    this.x = x; this.y = y; this.z = z;
    this.yaw = yaw;
    this.scale = scale;

    this.bed    = new MyWagonBed(scene, BED_LENGTH, BED_WIDTH, BED_HEIGHT);
    this.cover  = new MyWagonCover(scene, BED_LENGTH * 0.5, BED_WIDTH, BED_HEIGHT * 1.4);
    this.tongue = new MyWagonTongue(scene, TONGUE_LENGTH);
    this.wheel  = new MyWagonWheel(scene, WHEEL_RADIUS);

    // Horses live in world coordinates: place them at the tip of the tongue,
    // rotated to match the wagon's yaw so they "pull" it forward (+x local).
    const fwdDist = (BED_LENGTH * 0.5 + TONGUE_LENGTH) * scale;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const hx = x + cy * fwdDist;
    const hz = z - sy * fwdDist;
    const horseScale = 0.05 * scale;
    this.horses = [
      new MyHorse(scene, hx, y, hz, horseScale, yaw, horseTexture),
    ];
  }

  display() {
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.rotate(this.yaw, 0, 1, 0);
    this.scene.scale(this.scale, this.scale, this.scale);

    // Bed centred above the wheels.
    this.scene.pushMatrix();
    this.scene.translate(0, WHEEL_RADIUS + BED_HEIGHT * 0.5, 0);
    this.bed.display();
    this.scene.popMatrix();

    // Cover spans the back half of the bed, sitting on top of it.
    this.scene.pushMatrix();
    this.scene.translate(-BED_LENGTH * 0.25, WHEEL_RADIUS + BED_HEIGHT, 0);
    this.cover.display();
    this.scene.popMatrix();

    // Tongue extends forward from the front of the bed, just below it.
    this.scene.pushMatrix();
    this.scene.translate(BED_LENGTH * 0.5, WHEEL_RADIUS * 0.6, 0);
    this.tongue.display();
    this.scene.popMatrix();

    // 4 wheels: front-left, front-right, back-left, back-right.
    const wx = BED_LENGTH * 0.35;
    const wz = BED_WIDTH  * 0.5 + 0.05;
    const wheelOffsets = [[ wx,  wz], [ wx, -wz], [-wx,  wz], [-wx, -wz]];
    for (const [px, pz] of wheelOffsets) {
      this.scene.pushMatrix();
      this.scene.translate(px, WHEEL_RADIUS, pz);
      this.wheel.display();
      this.scene.popMatrix();
    }

    this.scene.popMatrix();

    // Horses use world transforms, so draw them outside the wagon's matrix.
    for (const h of this.horses) h.display();
  }
}

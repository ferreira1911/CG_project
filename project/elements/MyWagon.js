import { CGFobject, CGFtexture, CGFappearance } from '../../lib/CGF.js';
import { MyWagonBed }    from './MyWagonBed.js';
import { MyWagonCover }  from './MyWagonCover.js';
import { MyWagonTongue } from './MyWagonTongue.js';
import { MyWagonWheel }  from './MyWagonWheel.js';
import { MyHorse }       from './MyHorse.js';

// ── Wagon geometry constants ─────────────────────────────────────────────────
const BED_LENGTH         = 8.0;
const BED_WIDTH          = 4.0;
const BED_HEIGHT         = 0.9;
// Duplicates MyWagonBed.RAIL_HEIGHT_FACTOR — keep in sync.
const RAIL_HEIGHT        = BED_HEIGHT * 1.2;
const FRONT_WHEEL_RADIUS = 0.85;
const BACK_WHEEL_RADIUS  = 1.20;
const WHEEL_THICKNESS    = 0.22;
const TONGUE_LENGTH      = 3.5;

// ── Kinematics ───────────────────────────────────────────────────────────────
const MAX_SPEED    = 8.0;   // u/s  — comfortable horse walk speed
const ACCELERATION = 4.0;   // u/s² — 0 → max in ~2 s (loaded wagon feel)
const BRAKE        = 10.0;  // u/s² — S key: active braking, faster than accel
const FRICTION     = 2.0;   // u/s² — coasting deceleration when no key held

// ── Steering ─────────────────────────────────────────────────────────────────
const MAX_STEER    = Math.PI / 5;  // ~36° hard lock
const STEER_RATE   = 1.8;          // rad/s — steer-in speed while A/D held
const STEER_RETURN = 3.0;          // rad/s — self-centering speed on release
// Front axle at +wx, back axle at -wx  →  wheelbase = 2 * wx (local units)
const WHEELBASE    = 2 * BED_LENGTH * 0.35;


// Hierarchical covered light wagon: bed, cloth cover (back half), front tongue,
// 4 wheels (back pair larger), and a horse harnessed at the tongue tip.
export class MyWagon extends CGFobject {
  constructor(scene, x, y, z, yaw, scale, horseTexture) {
    super(scene);
    this.x = x; this.y = y; this.z = z;
    this.yaw   = yaw;
    this.scale = scale;

    // ── Textures & sub-objects ───────────────────────────────────────────────
    this.wheelTexture  = new CGFtexture(scene, './resources/textures/wheel.jpg');
    this.clothTexture  = new CGFtexture(scene, './resources/textures/cloth.jpg');
    this.woodenTexture = new CGFtexture(scene, './resources/textures/wood.png');

    this.bed        = new MyWagonBed(scene, BED_LENGTH, BED_WIDTH, BED_HEIGHT, this.woodenTexture);
    this.cover      = new MyWagonCover(scene, BED_LENGTH * 0.5, BED_WIDTH * 0.5, this.clothTexture);
    this.tongue     = new MyWagonTongue(scene, TONGUE_LENGTH, this.woodenTexture);
    this.frontWheel = new MyWagonWheel(scene, FRONT_WHEEL_RADIUS, WHEEL_THICKNESS, this.wheelTexture);
    this.backWheel  = new MyWagonWheel(scene, BACK_WHEEL_RADIUS,  WHEEL_THICKNESS, this.wheelTexture);

    // Horse is created at origin; _updateHorsePositions() immediately moves it
    // to the correct world coords so we don't duplicate the formula here.
    const horseScale = 0.02 * scale;
    this.horses = [
      new MyHorse(scene, 0, 0, 0, horseScale, 0, horseTexture),
    ];
    this._updateHorsePositions();

    // ── Kinematic state ──────────────────────────────────────────────────────
    this.speed         = 0;   // current forward speed (u/s), always ≥ 0
    this.steeringAngle = 0;   // front wheel yaw offset (rad); + = left
  }

  // ── Horse positioning ───────────────────────────────────────────────────────

  // Recompute horse world coords from current wagon position and heading.
  // Called once at construction and every update() tick.
  _updateHorsePositions() {
    const fwdDist = (BED_LENGTH * 0.5 + TONGUE_LENGTH) * this.scale;
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    for (const h of this.horses) {
      h.x   = this.x + cy * fwdDist;
      h.z   = this.z - sy * fwdDist;
      h.y   = (this.scene.terrain && this.scene.terrain.ready)
                ? this.scene.terrain.heightAt(h.x, h.z)
                : this.y;
      h.yaw = this.yaw + Math.PI / 2;
    }
  }

  // ── Per-frame update ─────────────────────────────────────────────────────────

  update(dt, iface) {
    // ── Speed (W = throttle, S = brake, else coast) ──────────────────────────
    if (iface.isKeyPressed('KeyW')) {
      this.speed = Math.min(this.speed + ACCELERATION * dt, MAX_SPEED);
    } else if (iface.isKeyPressed('KeyS')) {
      this.speed = Math.max(this.speed - BRAKE * dt, 0);
    } else {
      this.speed = Math.max(this.speed - FRICTION * dt, 0);
    }

    // ── Steering (A/D, with self-centering on release) ───────────────────────
    if (iface.isKeyPressed('KeyA')) {
      this.steeringAngle = Math.min(this.steeringAngle + STEER_RATE * dt,  MAX_STEER);
    } else if (iface.isKeyPressed('KeyD')) {
      this.steeringAngle = Math.max(this.steeringAngle - STEER_RATE * dt, -MAX_STEER);
    } else {
      // Return to centre at STEER_RETURN rate without overshooting zero.
      const sign = Math.sign(this.steeringAngle);
      this.steeringAngle -= sign * Math.min(STEER_RETURN * dt, Math.abs(this.steeringAngle));
    }

    // ── Yaw — bicycle (Ackermann) model ──────────────────────────────────────
    // ω = v * tan(φ) / L   where φ = steering angle, L = wheelbase (world units)
    const worldWheelbase = WHEELBASE * this.scale;
    const omega = (this.speed * Math.tan(this.steeringAngle)) / worldWheelbase;
    this.yaw += omega * dt;

    // ── Position ──────────────────────────────────────────────────────────────
    const dist = this.speed * dt;
    this.x += Math.cos(this.yaw) * dist;
    this.z -= Math.sin(this.yaw) * dist;
    if (this.scene.terrain && this.scene.terrain.ready)
      this.y = this.scene.terrain.heightAt(this.x, this.z);

    // ── Wheel spin ────────────────────────────────────────────────────────────
    // dist is in world units; convert to local (pre-scale) before dividing by radius.
    const localDist = dist / this.scale;
    this.frontWheel.spinAngle += localDist / FRONT_WHEEL_RADIUS;
    this.backWheel.spinAngle  += localDist / BACK_WHEEL_RADIUS;

    // ── Horse follow ──────────────────────────────────────────────────────────
    this._updateHorsePositions();
  }

  // ── Render ──────────────────────────────────────────────────────────────────

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

    // Tongue tucked under the bed front so it visually attaches to the wagon.
    this.scene.pushMatrix();
    this.scene.translate(BED_LENGTH * 0.5, BACK_WHEEL_RADIUS, 0);
    this.tongue.display();
    this.scene.popMatrix();

    // 4 wheels: front pair (smaller) also rotate around Y by steeringAngle
    // for visual fidelity. Back wheels never steer.
    const wx = BED_LENGTH * 0.35;
    const wz = BED_WIDTH  * 0.5 + WHEEL_THICKNESS * 0.5 + 0.02;
    const wheelPlacements = [
      [ wx,  wz, this.frontWheel, FRONT_WHEEL_RADIUS, true ],
      [ wx, -wz, this.frontWheel, FRONT_WHEEL_RADIUS, true ],
      [-wx,  wz, this.backWheel,  BACK_WHEEL_RADIUS,  false],
      [-wx, -wz, this.backWheel,  BACK_WHEEL_RADIUS,  false],
    ];
    for (const [px, pz, wheel, radius, isFront] of wheelPlacements) {
      this.scene.pushMatrix();
      this.scene.translate(px, radius, pz);
      if (isFront) this.scene.rotate(this.steeringAngle, 0, 1, 0);
      wheel.display();
      this.scene.popMatrix();
    }

    this.scene.popMatrix();

    // Horses use world transforms, so draw them outside the wagon's matrix.
    for (const h of this.horses) h.display();
  }
}

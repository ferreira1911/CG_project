import { CGFobject, CGFtexture, CGFappearance } from '../../lib/CGF.js';
import { MyWagonBed }    from './MyWagonBed.js';
import { MyWagonCover }  from './MyWagonCover.js';
import { MyWagonTongue } from './MyWagonTongue.js';
import { MyWagonWheel }  from './MyWagonWheel.js';
import { MyHorse }       from './MyHorse.js';
import { MyDriver }      from './MyDriver.js';
import { MyHorseAnimator }    from '../animators/MyHorseAnimator.js';
import { MyHayBaleAnimator }  from '../animators/MyHayBaleAnimator.js';
import { MyDustParticleSystem } from './MyDustParticleSystem.js';

// Wagon bed: 1- length along local +X  2- width along local +Z  3- floor/body height
const BED_LENGTH         = 8.0;
const BED_WIDTH          = 4.0;
const BED_HEIGHT         = 0.9;

// Rails and wheels: 1- side rail height  2/3- front/rear wheel radius  4- wheel width
const RAIL_HEIGHT        = BED_HEIGHT * 1.2;  // keep in sync with MyWagonBed
const FRONT_WHEEL_RADIUS = 0.85;
const BACK_WHEEL_RADIUS  = 1.20;
const WHEEL_THICKNESS    = 0.22;

// Horse hitch: 1- body distance from wagon front  2- forward offset  3- half hitch width
const HORSE_BODY_CENTER_DIST = 3.65;
const HORSE_HITCH_FORWARD    = -0.35;
const HORSE_HITCH_SPREAD     = 0.92;

// Speed model: 1- max speed  2- acceleration  3- brake force  4- coasting friction
const MAX_SPEED    = 8.0;
const ACCELERATION = 4.0;
const BRAKE        = 10.0;
const FRICTION     = 2.0;

// Steering model: 1- max steering angle  2- steering speed  3- return speed  4- axle distance
const MAX_STEER    = Math.PI / 5;
const STEER_RATE   = 1.8;
const STEER_RETURN = 3.0;
const WHEELBASE    = 2 * BED_LENGTH * 0.35;

// Gameplay physics: 1- pickup radius  2- HP drain/s  3- immunity  4- knockback  5- map boundary
const BALE_PICKUP_RADIUS = 6.0;
const PASSIVE_DRAIN_HP_S = 1.0;
const COLLISION_IFRAMES_S = 1.0;
const KNOCKBACK_FRAC = 0.9;
const MAP_BOUNDARY_RADIUS = 140.0;

// Terrain tilt: 1- max pitch/roll angle  2- smoothing time constant
const MAX_TILT       = Math.PI / 9;
const TILT_SMOOTH_TC = 0.1;

export class MyWagon extends CGFobject {
  // Builds wagon parts and initial gameplay state.
  constructor(scene, x, y, z, yaw, scale, horseTexture) {
    super(scene);
    this.x = x; this.y = y; this.z = z;
    this.yaw   = yaw;
    this.scale = scale;

    this.clothTexture  = new CGFtexture(scene, './resources/textures/wagon/cloth.jpg');
    this.woodenTexture = new CGFtexture(scene, './resources/textures/wagon/wood.png');
    this.bedTexture    = new CGFtexture(scene, './resources/textures/wagon/woodBed.jpg');

    this.bed        = new MyWagonBed(scene, BED_LENGTH, BED_WIDTH, BED_HEIGHT, this.bedTexture);
    this.cover      = new MyWagonCover(scene, BED_LENGTH * 0.5, BED_WIDTH * 0.5, this.clothTexture);
    this.tongue     = new MyWagonTongue(scene, this.woodenTexture);
    this.driver     = new MyDriver(scene);
    this.frontWheel = new MyWagonWheel(scene, FRONT_WHEEL_RADIUS, WHEEL_THICKNESS, this.bedTexture);
    this.backWheel  = new MyWagonWheel(scene, BACK_WHEEL_RADIUS,  WHEEL_THICKNESS, this.bedTexture);

    this.reinAppearance = new CGFappearance(scene);
    this.reinAppearance.setAmbient(0.10, 0.06, 0.03, 1.0);
    this.reinAppearance.setDiffuse(0.26, 0.16, 0.08, 1.0);
    this.reinAppearance.setSpecular(0.03, 0.02, 0.01, 1.0);
    this.reinAppearance.setShininess(4.0);

    const horseScale = 0.018 * scale;
    this.horses = [new MyHorse(scene, 0, 0, 0, horseScale, 0, horseTexture)];
    this._updateHorsePositions();

    this.horseAnimator = new MyHorseAnimator(this.horses[0], 0.3, 0.6);

    this.speed         = 0;
    this.accel         = 0;
    this.steeringAngle = 0;
    this.pitch         = 0;  // around local +Z, nose-up positive
    this.roll          = 0;  // around local +X, right-side-down positive

    this.maxHp = 150;
    this.hp = 150;
    this.invulnerabilityTimer = 0;

    this.carriedBales   = [];     // up to 2 simultaneously
    this._pPressedLast  = false;  // edge-detect for P (pickup)
    this._lPressedLast  = false;  // edge-detect for L (drop)

    // Y offset (in wagon-local space) where carried bales rest on the bed.
    this.BALE_CARRY_Y   = BACK_WHEEL_RADIUS + BED_HEIGHT;

    // ── Dynamics & Particles ──────────────────────────────────────────────────
    this.roll = 0;
    this.dustSystem = new MyDustParticleSystem(scene);
  }

  // Updates the horse world position from the wagon transform.
  _updateHorsePositions() {
    const fwdDist = (BED_LENGTH * 0.5 + HORSE_BODY_CENTER_DIST) * this.scale;
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);

    const shiftFactor = 2.0 * this.scale;
    const shiftX = -sy * this.steeringAngle * shiftFactor;
    const shiftZ = -cy * this.steeringAngle * shiftFactor;

    for (const h of this.horses) {
      h.x   = this.x + cy * fwdDist + shiftX;
      h.z   = this.z - sy * fwdDist + shiftZ;
      h.y   = (this.scene.terrain && this.scene.terrain.ready)
                ? this.scene.terrain.heightAt(h.x, h.z)
                : this.y;
      h.yaw = this.yaw + Math.PI / 2 + this.steeringAngle * 0.6;
      h.bodyPitch = this.pitch * 0.5;
      h.bodyRoll  = this.roll  * 0.5;
    }
  }

  // Runs every gameplay tick: motion, terrain tilt, damage, animation, and input.
  update(dt, iface) {
    this._updateSpeed(dt, iface);
    this._updateSteering(dt, iface);
    this._integrateMotion(dt);
    this._updateBodyOrientation(dt);
    this._updateHp(dt);
    if (this.invulnerabilityTimer <= 0) this._resolveCollisions();
    this._updateHorseAnimation();
    this._updateWheelSpin(dt);
    this._updateHorsePositions();
    this._handleBaleInput(iface);
    this._updateCarriedBales();
    this._tickDropAnimators();
    this._updateDust(dt);
  }

  // Updates forward speed from W/S input, braking, and passive friction.
  _updateSpeed(dt, iface) {
    const prevSpeed = this.speed;

    if (iface.isKeyPressed('KeyW')) {
      this.speed = Math.min(this.speed + ACCELERATION * dt, MAX_SPEED);
    } else if (iface.isKeyPressed('KeyS')) {
      // Brake forward; never reverse manually. If knocked back (speed<0)
      // friction handles deceleration.
      if (this.speed > 0) this.speed = Math.max(this.speed - BRAKE * dt, 0);
      else if (this.speed < 0) this.speed = Math.min(this.speed + FRICTION * dt, 0);
    } else {
      // Coast — friction pulls toward 0 from either side.
      if (this.speed > 0) this.speed = Math.max(this.speed - FRICTION * dt, 0);
      else if (this.speed < 0) this.speed = Math.min(this.speed + FRICTION * dt, 0);
    }



    this.accel = (this.speed - prevSpeed) / dt;
    
  }

  // Updates the steering angle from A/D input and recentres it on release.
  _updateSteering(dt, iface) {
    if (iface.isKeyPressed('KeyA')) {
      this.steeringAngle = Math.min(this.steeringAngle + STEER_RATE * dt,  MAX_STEER);
    } else if (iface.isKeyPressed('KeyD')) {
      this.steeringAngle = Math.max(this.steeringAngle - STEER_RATE * dt, -MAX_STEER);
    } else {
      // Return to centre at STEER_RETURN rate without overshooting zero.
      const sign = Math.sign(this.steeringAngle);
      this.steeringAngle -= sign * Math.min(STEER_RETURN * dt, Math.abs(this.steeringAngle));
    }
  }

  // Updates dust particles.
  _updateDust(dt) {
    if (Math.abs(this.speed) > 4.0) {
        // Increased spawn chance for more frequent dust
        if (Math.random() < 0.7) {
            const wx = BED_LENGTH * 0.35 * this.scale;
            const wz = (BED_WIDTH * 0.5 + WHEEL_THICKNESS * 0.5 + 0.02) * this.scale;
            const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
            
            const toWorld = (lx, lz) => [
                this.x + lx * cy + lz * sy,
                this.z - lx * sy + lz * cy,
            ];
            
            const [px1, pz1] = toWorld(-wx, wz);
            this.dustSystem.spawn(px1, this.y + 0.3, pz1, this.speed, this.yaw);
            
            const [px2, pz2] = toWorld(-wx, -wz);
            this.dustSystem.spawn(px2, this.y + 0.3, pz2, this.speed, this.yaw);
        }
    }
    this.dustSystem.update(dt);
  }

  // Moves the wagon using a bicycle/Ackermann steering approximation.
  _integrateMotion(dt) {
    const worldWheelbase = WHEELBASE * this.scale;
    this.yaw += (this.speed * Math.tan(this.steeringAngle)) / worldWheelbase * dt;

    const dist = this.speed * dt;
    this.x += Math.cos(this.yaw) * dist;
    this.z -= Math.sin(this.yaw) * dist;
    this._collideWithMapBoundary(1.6 * this.scale);
    if (this.scene.terrain && this.scene.terrain.ready) this.y = this.scene.terrain.heightAt(this.x, this.z);
    this._lastDist = dist;
  }

  // Updates wagon pitch and roll from terrain height samples.
  _updateBodyOrientation(dt) {
    const terrain = this.scene.terrain;
    if (!terrain || !terrain.ready) return;

    const halfWB    = WHEELBASE * 0.5 * this.scale;
    const halfWidth = (BED_WIDTH * 0.5) * this.scale;
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);

    const hFront = terrain.heightAt(this.x + cy * halfWB,    this.z - sy * halfWB);
    const hBack  = terrain.heightAt(this.x - cy * halfWB,    this.z + sy * halfWB);
    const hRight = terrain.heightAt(this.x + sy * halfWidth, this.z + cy * halfWidth);
    const hLeft  = terrain.heightAt(this.x - sy * halfWidth, this.z - cy * halfWidth);

    let targetPitch = Math.atan2(hFront - hBack, 2 * halfWB);
    let targetRoll  = Math.atan2(hLeft  - hRight, 2 * halfWidth);
    
    // ── Add dynamic weight shift (pitch & roll) ──────────────────
    const MAX_ACCEL_PITCH = Math.PI / 80; 


    const MAX_CORNER_ROLL = Math.PI / 75; 

    // nose of the wagon lifts on acceleration, and dives under braking.
    targetPitch += (this.accel || 0) * (MAX_ACCEL_PITCH / BRAKE);

    // Only apply cornering lean when moving at max speed
    if (Math.abs(this.speed) >= MAX_SPEED * 0.98) {
        targetRoll += Math.sign(this.speed) * (this.steeringAngle / MAX_STEER) * MAX_CORNER_ROLL;
    }

    if (targetPitch >  MAX_TILT) targetPitch =  MAX_TILT;
    if (targetPitch < -MAX_TILT) targetPitch = -MAX_TILT;
    if (targetRoll  >  MAX_TILT) targetRoll  =  MAX_TILT;
    if (targetRoll  < -MAX_TILT) targetRoll  = -MAX_TILT;

    const k = 1 - Math.exp(-dt / TILT_SMOOTH_TC);
    this.pitch += (targetPitch - this.pitch) * k;
    this.roll  += (targetRoll  - this.roll)  * k;
  }

  // Applies passive health drain and counts down collision invulnerability.
  _updateHp(dt) {
    if (this.hp > 0) {
      // Difficulty ramp: +0.5 HP/s drain per full 30 s of score.
      const difficultyMul = 1.0 + Math.floor((this.scene.uiScore || 0) / 30) * 0.5;
      this.hp = Math.max(0, this.hp - PASSIVE_DRAIN_HP_S * difficultyMul * dt);
    }
    if (this.invulnerabilityTimer > 0) this.invulnerabilityTimer -= dt;
  }

  // Checks collision targets in priority order and stops after the first hit.
  _resolveCollisions() {
    const wagonRadius = 1.6 * this.scale;
    if (this._collideWithRocks(wagonRadius)) return;
    if (this._collideWithTrees(wagonRadius)) return;
    this._collideWithBarn(wagonRadius);
  }

  // Keeps the wagon inside the circular map boundary.
  _collideWithMapBoundary(wagonRadius) {
    const distSq = this.x * this.x + this.z * this.z;
    const maxDist = MAP_BOUNDARY_RADIUS - wagonRadius;
    if (distSq <= maxDist * maxDist) return false;

    const dist = Math.sqrt(distSq) || 1;
    this.x = (this.x / dist) * maxDist;
    this.z = (this.z / dist) * maxDist;

    if (this.invulnerabilityTimer <= 0) this._triggerCollisionFeedback();
    return true;
  }

  // Checks circular collision against every rock.
  _collideWithRocks(wagonRadius) {
    if (!this.scene.rocks) return false;
    for (const rock of this.scene.rocks) {
      const rockRadius = Math.max(rock.sx, rock.sz) * 0.5;
      const dx = this.x - rock.x, dz = this.z - rock.z;
      const r = wagonRadius + rockRadius;
      if (dx * dx + dz * dz < r * r) {
        this._triggerCollisionDamage(5, 15);
        return true;
      }
    }
    return false;
  }

  // Checks tree collisions and starts the tree-fall animation on impact.
  _collideWithTrees(wagonRadius) {
    if (!this.scene.treeZones) return false;
    for (const zone of this.scene.treeZones) {
      if (zone.isFallen) continue;
      const dx = this.x - zone.x, dz = this.z - zone.z;
      const distSq = dx * dx + dz * dz;
      const minDist = wagonRadius + zone.radius;
      if (distSq >= minDist * minDist) continue;

      this._triggerCollisionDamage(10, 20);
      zone.isFallen = true;
      if (zone.flora && zone.animator) {
        const len = Math.sqrt(distSq);
        const dirX = len > 0.001 ? -dx / len : 1;
        const dirZ = len > 0.001 ? -dz / len : 0;
        zone.flora.fallAxis = [dirZ, 0, -dirX];
        zone.animator.enable(this.scene.time);
      }
      return true;
    }
    return false;
  }

  // Checks collision against the barn box.
  _collideWithBarn(wagonRadius) {
    const barn = this.scene.barn;
    if (!barn) return false;

    const dx = this.x - barn.x;
    const dz = this.z - barn.z;
    const cosNegYaw = Math.cos(-barn.yaw);
    const sinNegYaw = Math.sin(-barn.yaw);
    const localX =  dx * cosNegYaw + dz * sinNegYaw;
    const localZ = -dx * sinNegYaw + dz * cosNegYaw;

    const hw = barn.width / 2, hd = barn.depth / 2;
    const cX = Math.max(-hw, Math.min(hw, localX));
    const cZ = Math.max(-hd, Math.min(hd, localZ));
    const distX = localX - cX, distZ = localZ - cZ;

    if (distX * distX + distZ * distZ < wagonRadius * wagonRadius) {
      this._triggerCollisionDamage(20, 30);
      return true;
    }
    return false;
  }

  // Starts/stops the horse gait animation according to wagon speed.
  _updateHorseAnimation() {
    if (Math.abs(this.speed) > 0.1) {
      // Re-enable using current time so the animator doesn't time-skip on resume.
      if (!this.horseAnimator.active) this.horseAnimator.enable(this.scene.time);
      this.horseAnimator.update(this.scene.time);
    } else if (this.horseAnimator.active) {
      this.horseAnimator.disable();
      for (const h of this.horses) {
        h.animYOffset = 0;
        h.animPitchOffset = 0;
      }
    }
  }

  // Spins front and rear wheels according to the travelled distance.
  _updateWheelSpin() {
    // Distance is world-space; convert to pre-scale before dividing by wheel radius.
    const localDist = this._lastDist / this.scale;
    // Negative spin: rotate(+θ, 0,0,1) pushes the wheel's top toward -x; we
    // want the top moving +x as the wagon advances, so the angle decreases.
    this.frontWheel.spinAngle -= localDist / FRONT_WHEEL_RADIUS;
    this.backWheel.spinAngle  -= localDist / BACK_WHEEL_RADIUS;
  }

  // Handles edge-triggered pickup/drop input for hay bales.
  _handleBaleInput(iface) {
    const pNow = iface.isKeyPressed('KeyP');
    const lNow = iface.isKeyPressed('KeyL');

    if (pNow && !this._pPressedLast && this.carriedBales.length < 2 && this.scene.haybales) {
      this._tryPickupNearestBale();
    }
    if (lNow && !this._lPressedLast && this.carriedBales.length > 0) {
      this._dropLastCarriedBale();
    }

    this._pPressedLast = pNow;
    this._lPressedLast = lNow;
  }

  // Picks the nearest available bale inside pickup radius.
  _tryPickupNearestBale() {
    let nearest = null, nearestDist = Infinity;
    for (const bale of this.scene.haybales) {
      // A bale mid-drop is fair game — pickup cancels the drop animation.
      if (bale.isPickedUp && !(bale.dropAnimator && bale.dropAnimator.active)) continue;
      if (this.carriedBales.includes(bale)) continue;

      const dx = bale.x - this.x, dz = bale.z - this.z;
      const d  = Math.sqrt(dx * dx + dz * dz);
      if (d < BALE_PICKUP_RADIUS && d < nearestDist) {
        nearestDist = d;
        nearest = bale;
      }
    }
    if (nearest) {
      if (nearest.dropAnimator) nearest.dropAnimator.disable();
      nearest.isPickedUp = true;
      this.carriedBales.push(nearest);
    }
  }

  // Drops the last carried bale and starts its fall animation.
  _dropLastCarriedBale() {
    const i = this.carriedBales.length - 1;
    const bale = this.carriedBales.pop();

    // Bale sits at offsetMultiplier on the bed's long axis (0.15 or -0.15
    // depending on slot), then we rotate into world space and snap Y to
    // the wagon bed height; the drop animator interpolates Y down to ground.
    const offsetMultiplier = (i === 0) ? 0.15 : -0.15;
    const localX = -BED_LENGTH * offsetMultiplier;
    const localZ = -0.5;
    const scaledX = localX * this.scale;
    const scaledZ = localZ * this.scale;

    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);
    bale.x   = this.x + scaledX * cy + scaledZ * sy;
    bale.z   = this.z - scaledX * sy + scaledZ * cy;
    bale.yaw = this.yaw;

    bale.groundY = this.scene.terrain?.heightAt(bale.x, bale.z) ?? this.y;
    bale.renderY = this.y + this.BALE_CARRY_Y * this.scale;

    bale.dropAnimator = new MyHayBaleAnimator(bale, bale.renderY, bale.groundY);
    bale.dropAnimator.enable(this.scene.time);
  }

  // Keeps carried bale render heights synced to the wagon bed.
  _updateCarriedBales() {
    // Carried bales render in wagon-local space inside display(); we only
    // refresh renderY here so they stay on top of the bed if the wagon's
    // ground Y changed.
    for (const c of this.carriedBales) {
      c.renderY = this.y + this.BALE_CARRY_Y * this.scale;
    }
  }

  // Advances active bale drop animations and marks newly landed bales.
  _tickDropAnimators() {
    if (!this.scene.haybales) return;
    for (const bale of this.scene.haybales) {
      if (!(bale.dropAnimator && bale.dropAnimator.active)) continue;
      bale.dropAnimator.update(this.scene.time);
      if (!bale.dropAnimator.active) {
        bale.isPickedUp = false;
        bale.renderY    = bale.groundY;
        bale._justLanded = true;  // consumed next frame by MyScene._updateBarn
      }
    }
  }

  // Applies knockback, invulnerability, and camera shake.
  _triggerCollisionFeedback() {
    this.invulnerabilityTimer = COLLISION_IFRAMES_S;
    this.speed = -MAX_SPEED * KNOCKBACK_FRAC;
    this.scene.cameraShake = 1.0;
  }

  // Applies random damage and shared collision feedback.
  _triggerCollisionDamage(minDmg, maxDmg) {
    const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
    this.hp = Math.max(0, this.hp - dmg);
    this.scene.uiDamage = dmg;
    this._triggerCollisionFeedback();
  }

  // Draws the full wagon assembly in wagon-local space.
  display() {
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.rotate(this.yaw, 0, 1, 0);

    // ── Apply Roll, Pitch & Prevent Clipping ──────────────────────────────────────
    const wz = BED_WIDTH * 0.5 + WHEEL_THICKNESS * 0.5 + 0.02;
    const liftY = Math.abs(wz * Math.sin(this.roll));
    this.scene.translate(0, liftY, 0);

    // Roll first (bank around forward axis), then pitch (nose-up around lateral axis).
    this.scene.rotate(this.roll, 1, 0, 0);
    this.scene.rotate(this.pitch, 0, 0, 1);
    this.scene.scale(this.scale, this.scale, this.scale);

    // Bed centred above the back axle (back wheels set the bed height).
    this.scene.pushMatrix();
    this.scene.translate(0, BACK_WHEEL_RADIUS + BED_HEIGHT * 0.5, 0);
    this.bed.display();
    this.scene.popMatrix();

    // Cover sits on the side-rail top plank (RAIL_HEIGHT * 0.8 above the bed).
    this.scene.pushMatrix();
    this.scene.translate(-BED_LENGTH * 0.25, BACK_WHEEL_RADIUS + BED_HEIGHT + RAIL_HEIGHT * 0.8, 0);
    this.cover.display();
    this.scene.popMatrix();

    this._displayCarriedBales();
    this._displayDriver();

    this._displayTongue();
    this._displayReins();

    this._displayWheels();

    this.scene.popMatrix();

    // Horses use world transforms, so draw them outside the wagon's matrix.
    for (const h of this.horses) h.display();

    // ── Draw Dust Particles ───────────────────────────────────────────────────
    this.dustSystem.display();
  }

  // Draws the double-shaft tongue from the wagon pivot to horse hitch points.
  _displayTongue() {
    const [leftTarget, rightTarget] = this._hitchTargets();
    const origin = [BED_LENGTH * 0.5 - 0.55, this._tongueY(), 0];
    const toTongueLocal = (p) => [p[0] - origin[0], p[1] - origin[1], p[2] - origin[2]];

    this.scene.pushMatrix();
    this.scene.translate(origin[0], origin[1], origin[2]);
    this.tongue.displayToTargets(toTongueLocal(leftTarget), toTongueLocal(rightTarget));
    this.scene.popMatrix();
  }

  // Draws the seated driver on the front bench.
  _displayDriver() {
    this.scene.pushMatrix();
    this.scene.translate(BED_LENGTH * 0.5 - 1.0, BACK_WHEEL_RADIUS + BED_HEIGHT + 0.25, 0);
    this.driver.display();
    this.scene.popMatrix();
  }

  // Draws the reins from the driver's hands to the horse hitch points.
  _displayReins() {
    this.reinAppearance.apply();

    const startX = BED_LENGTH * 0.5 - 0.45;
    const startY = BACK_WHEEL_RADIUS + BED_HEIGHT + 1.35;
    const [leftEnd, rightEnd] = this._hitchTargets(0.18);

    this._displayBarBetween([startX, startY,  0.36], leftEnd,  0.030);
    this._displayBarBetween([startX, startY, -0.36], rightEnd, 0.030);
  }

  // Height of the wagon-side tongue pivot in wagon-local coordinates.
  _tongueY() {
    return BACK_WHEEL_RADIUS + BED_HEIGHT * 1.05;
  }

  // Returns the horse steering angle relative to the wagon frame.
  _hitchSteer() {
    const horse = this.horses && this.horses[0];
    if (horse) return horse.yaw - this.yaw - Math.PI / 2;
    return this.steeringAngle * 0.6;
  }

  // Computes left/right horse hitch points and converts them to wagon-local space.
  _hitchTargets(lift = 0) {
    const horse = this.horses && this.horses[0];
    if (!horse) return [
      [BED_LENGTH * 0.5 + HORSE_BODY_CENTER_DIST, this._tongueY() + lift,  HORSE_HITCH_SPREAD],
      [BED_LENGTH * 0.5 + HORSE_BODY_CENTER_DIST, this._tongueY() + lift, -HORSE_HITCH_SPREAD],
    ];

    const forwardX = Math.sin(horse.yaw);
    const forwardZ = Math.cos(horse.yaw);
    const lateralX = Math.cos(horse.yaw);
    const lateralZ = -Math.sin(horse.yaw);

    const center = [
      horse.x + forwardX * HORSE_HITCH_FORWARD * this.scale,
      horse.y + (horse.animYOffset || 0) + (this._tongueY() + lift) * this.scale,
      horse.z + forwardZ * HORSE_HITCH_FORWARD * this.scale,
    ];

    const spread = HORSE_HITCH_SPREAD * this.scale;
    return [
      this._worldToWagonLocal([
        center[0] - lateralX * spread,
        center[1],
        center[2] - lateralZ * spread,
      ]),
      this._worldToWagonLocal([
        center[0] + lateralX * spread,
        center[1],
        center[2] + lateralZ * spread,
      ]),
    ];
  }

  // Converts a world-space point into the tilted/scaled wagon-local frame.
  _worldToWagonLocal(point) {
    let x = point[0] - this.x;
    let y = point[1] - this.y;
    let z = point[2] - this.z;

    const cy = Math.cos(-this.yaw), sy = Math.sin(-this.yaw);
    [x, z] = [x * cy + z * sy, -x * sy + z * cy];

    const cr = Math.cos(-this.roll), sr = Math.sin(-this.roll);
    [y, z] = [y * cr - z * sr, y * sr + z * cr];

    const cp = Math.cos(-this.pitch), sp = Math.sin(-this.pitch);
    [x, y] = [x * cp - y * sp, x * sp + y * cp];

    return [x / this.scale, y / this.scale, z / this.scale];
  }

  // Draws one thin cube bar between two wagon-local points.
  _displayBarBetween(a, b, thickness) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const yaw = Math.atan2(-dz, dx);
    const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

    this.scene.pushMatrix();
    this.scene.translate((a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5, (a[2] + b[2]) * 0.5);
    this.scene.rotate(yaw, 0, 1, 0);
    this.scene.rotate(pitch, 0, 0, 1);
    this.scene.scale(len, thickness, thickness);
    this.scene.cube.display();
    this.scene.popMatrix();
  }

  // Draws hay bales currently being carried on the wagon bed.
  _displayCarriedBales() {
    for (let i = 0; i < this.carriedBales.length; i++) {
      const bale = this.carriedBales[i];
      const offsetMultiplier = (i === 0) ? 0.15 : -0.15;
      const localX = -BED_LENGTH * offsetMultiplier;

      // Bale mesh is centred at origin with its long axis along +X. Rotate
      // -π/2 around +Y to lay it across the bed (long axis → wagon +Z), and
      // lift by RADIUS*scale so the cylinder side rests on the bed floor.
      this.scene.pushMatrix();
      this.scene.translate(localX, this.BALE_CARRY_Y + bale.RADIUS * bale.scale, -0.5);
      this.scene.rotate(-Math.PI / 2, 0, 1, 0);
      this.scene.scale(bale.scale, bale.scale, bale.scale);
      bale.drawMesh();
      this.scene.popMatrix();
    }
  }

  // Draws all four wheels, steering only the front pair visually.
  _displayWheels() {
    const wx = BED_LENGTH * 0.35;
    const wz = BED_WIDTH  * 0.5 + WHEEL_THICKNESS * 0.5 + 0.02;
    // [px, pz, wheel, radius, isFront] — front wheels also rotate around Y
    // by steeringAngle for visual fidelity; back wheels never steer.
    const placements = [
      [ wx,  wz, this.frontWheel, FRONT_WHEEL_RADIUS, true ],
      [ wx, -wz, this.frontWheel, FRONT_WHEEL_RADIUS, true ],
      [-wx,  wz, this.backWheel,  BACK_WHEEL_RADIUS,  false],
      [-wx, -wz, this.backWheel,  BACK_WHEEL_RADIUS,  false],
    ];
    for (const [px, pz, wheel, radius, isFront] of placements) {
      this.scene.pushMatrix();
      this.scene.translate(px, radius, pz);
      if (isFront) this.scene.rotate(this.steeringAngle, 0, 1, 0);
      wheel.display();
      this.scene.popMatrix();
    }
  }
}

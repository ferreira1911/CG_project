import { CGFobject, CGFtexture, CGFappearance } from '../../lib/CGF.js';
import { MyWagonBed }    from './MyWagonBed.js';
import { MyWagonCover }  from './MyWagonCover.js';
import { MyWagonTongue } from './MyWagonTongue.js';
import { MyWagonWheel }  from './MyWagonWheel.js';
import { MyHorse }       from './MyHorse.js';
import { MyHorseAnimator }    from '../animators/MyHorseAnimator.js';
import { MyHayBaleAnimator }  from '../animators/MyHayBaleAnimator.js';

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
    this.clothTexture  = new CGFtexture(scene, './resources/textures/wagon/cloth.jpg');
    this.woodenTexture = new CGFtexture(scene, './resources/textures/wagon/wood.png');
    this.bedTexture    = new CGFtexture(scene, './resources/textures/wagon/woodBed.jpg');

    this.bed        = new MyWagonBed(scene, BED_LENGTH, BED_WIDTH, BED_HEIGHT, this.bedTexture);
    this.cover      = new MyWagonCover(scene, BED_LENGTH * 0.5, BED_WIDTH * 0.5, this.clothTexture);
    this.tongue     = new MyWagonTongue(scene, TONGUE_LENGTH, this.woodenTexture);
    // Wheels are baked geometry (rim + hub + spokes), textured with wood.
    this.frontWheel = new MyWagonWheel(scene, FRONT_WHEEL_RADIUS, WHEEL_THICKNESS, this.bedTexture);
    this.backWheel  = new MyWagonWheel(scene, BACK_WHEEL_RADIUS,  WHEEL_THICKNESS, this.bedTexture);

    // Horse is created at origin; _updateHorsePositions() immediately moves it
    // to the correct world coords so we don't duplicate the formula here.
    // Reduced the horse scale multiplier so the wagon feels significantly larger than the horse.
    const horseScale = 0.018 * scale;
    this.horses = [
      new MyHorse(scene, 0, 0, 0, horseScale, 0, horseTexture),
    ];
    this._updateHorsePositions();

    // ── Animators ────────────────────────────────────────────────────────────
    // Horse bounces 0.3 units high every 0.6 seconds
    this.horseAnimator = new MyHorseAnimator(this.horses[0], 0.3, 0.6);

    // ── Kinematic state ──────────────────────────────────────────────────────
    this.speed         = 0;   // current forward speed (u/s), always ≥ 0
    this.steeringAngle = 0;   // front wheel yaw offset (rad); + = left

    // ── Gameplay state ───────────────────────────────────────────────────────
    this.maxHp = 150;
    this.hp = 150;
    this.invulnerabilityTimer = 0;

    // ── Hay Bale state ──────────────────────────────────────────────────────
    this.carriedBales   = [];    // Array of up to 2 MyHayBale currently on the wagon
    this._pPressedLast  = false; // Edge-detect for P key (pickup)
    this._lPressedLast  = false; // Edge-detect for L key (drop)

    // Sitting on the bed floor (BACK_WHEEL_RADIUS + BED_HEIGHT)
    this.BALE_CARRY_Y   = BACK_WHEEL_RADIUS + BED_HEIGHT;
  }

  // ── Horse positioning ───────────────────────────────────────────────────────

  // Recompute horse world coords from current wagon position and heading.
  // Called once at construction and every update() tick.
  _updateHorsePositions() {
    const fwdDist = (BED_LENGTH * 0.5 + TONGUE_LENGTH) * this.scale;
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
    
    // Shift the horse laterally into the turn (positive steering is left)
    // Left vector is (-sin(yaw), 0, -cos(yaw))
    const shiftFactor = 2.0 * this.scale;
    const shiftX = -Math.sin(this.yaw) * this.steeringAngle * shiftFactor;
    const shiftZ = -Math.cos(this.yaw) * this.steeringAngle * shiftFactor;
    
    for (const h of this.horses) {
      h.x   = this.x + cy * fwdDist + shiftX;
      h.z   = this.z - sy * fwdDist + shiftZ;
      h.y   = (this.scene.terrain && this.scene.terrain.ready)
                ? this.scene.terrain.heightAt(h.x, h.z)
                : this.y;
      // Rotate slightly less than the wheels to look like it's dragging the tongue
      h.yaw = this.yaw + Math.PI / 2 + (this.steeringAngle * 0.6);
    }
  }

  // ── Per-frame update ─────────────────────────────────────────────────────────

  update(dt, iface) {
    // ── Speed (W = throttle, S = brake, else coast) ──────────────────────────
    if (iface.isKeyPressed('KeyW')) {
      this.speed = Math.min(this.speed + ACCELERATION * dt, MAX_SPEED);
    } else if (iface.isKeyPressed('KeyS')) {
      // Brake forward movement only. Cannot manually reverse.
      if (this.speed > 0) {
          this.speed = Math.max(this.speed - BRAKE * dt, 0);
      } else if (this.speed < 0) {
          // If holding brake while knocked back, just let friction slow us to 0
          this.speed = Math.min(this.speed + FRICTION * dt, 0);
      }
    } else {
      // Coasting: decay towards 0 from either direction
      if (this.speed > 0) {
          this.speed = Math.max(this.speed - FRICTION * dt, 0);
      } else if (this.speed < 0) {
          // If knocked back (negative speed), friction slows us back to 0
          this.speed = Math.min(this.speed + FRICTION * dt, 0);
      }
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

    // ── HP & Collisions ───────────────────────────────────────────────────────
    // Passive damage (-1 HP per second, increasing over time for difficulty scaling)
    if (this.hp > 0) {
        // Option A: Increase drain by 0.5 HP/s every 30 seconds of score
        const difficultyMultiplier = 1.0 + Math.floor((this.scene.uiScore || 0) / 30) * 0.5;
        this.hp = Math.max(0, this.hp - (1.0 * difficultyMultiplier) * dt);
    }

    // Invulnerability timer
    if (this.invulnerabilityTimer > 0) {
        this.invulnerabilityTimer -= dt;
    }

    // Collisions
    if (this.invulnerabilityTimer <= 0) {
        // Approximate wagon bounding radius
        const wagonRadius = 1.6 * this.scale;
        let collided = false;

        // 1. Rock Collisions
        if (!collided && this.scene.rocks) {
            for (const rock of this.scene.rocks) {
                const rockRadius = Math.max(rock.sx, rock.sz) * 0.5; 
                const dx = this.x - rock.x;
                const dz = this.z - rock.z;
                
                if (dx * dx + dz * dz < (wagonRadius + rockRadius) * (wagonRadius + rockRadius)) {
                    this._triggerCollisionDamage(5, 15);
                    collided = true;
                    break; 
                }
            }
        }

        // 2. Tree Collisions
        if (!collided && this.scene.treeZones) {
            for (const zone of this.scene.treeZones) {
                if (zone.isFallen) continue; // Skip already fallen trees

                const dx = this.x - zone.x;
                const dz = this.z - zone.z;
                const distSq = dx * dx + dz * dz;
                const minDist = wagonRadius + zone.radius;

                if (distSq < minDist * minDist) {
                    this._triggerCollisionDamage(10, 20);
                    collided = true;

                    // Trigger Tree Fall Animation
                    zone.isFallen = true;
                    if (zone.flora && zone.animator) {
                        // Calculate impact vector
                        const impactLength = Math.sqrt(distSq);
                        let dirX = 1, dirZ = 0;
                        if (impactLength > 0.001) {
                            // Direction from wagon TO tree
                            dirX = -dx / impactLength;
                            dirZ = -dz / impactLength;
                        }
                        
                        // Cross product of (dirX, 0, dirZ) with UP (0, 1, 0) gives the rotation axis!
                        // Right-hand rule: axis = cross(impact_dir, UP)
                        // impact_dir x UP = (dirZ, 0, -dirX)
                        zone.flora.fallAxis = [dirZ, 0, -dirX];
                        
                        zone.animator.enable(this.scene.time);
                    }
                    break;
                }
            }
        }

        // 3. Barn Collision (OBB vs Circle)
        if (!collided && this.scene.barn) {
            const barn = this.scene.barn;
            // 1. Vector from barn center to wagon
            const dx = this.x - barn.x;
            const dz = this.z - barn.z;

            // 2. Rotate this vector by the INVERSE of the barn's yaw
            // This brings the wagon's position into the barn's local coordinate space.
            const cosYaw = Math.cos(-barn.yaw);
            const sinYaw = Math.sin(-barn.yaw);
            const localX = dx * cosYaw + dz * sinYaw;
            const localZ = -dx * sinYaw + dz * cosYaw;

            // 3. Clamp the local position to the barn's extents
            const halfWidth = barn.width / 2;
            const halfDepth = barn.depth / 2;
            
            let closestX = localX;
            let closestZ = localZ;

            if (closestX < -halfWidth) closestX = -halfWidth;
            else if (closestX > halfWidth) closestX = halfWidth;

            if (closestZ < -halfDepth) closestZ = -halfDepth;
            else if (closestZ > halfDepth) closestZ = halfDepth;

            // 4. Calculate distance from closest point on the barn to the wagon center
            const distX = localX - closestX;
            const distZ = localZ - closestZ;

            if (distX * distX + distZ * distZ < wagonRadius * wagonRadius) {
                // Wagon is intersecting the barn rectangle!
                this._triggerCollisionDamage(20, 30); // Barn hits hard
                collided = true;
            }
        }
    }



    // ── Animations ────────────────────────────────────────────────────────────
    if (Math.abs(this.speed) > 0.1) {
        // If it was disabled, re-enable it using current time to prevent time-skipping
        if (!this.horseAnimator.active) this.horseAnimator.enable(this.scene.time);
        this.horseAnimator.update(this.scene.time);
    } else {
        // Wagon is stopped: stop animating and snap horse back to standing flat
        if (this.horseAnimator.active) {
            this.horseAnimator.disable();
            for (const h of this.horses) {
                h.animYOffset = 0;
                h.animPitchOffset = 0;
            }
        }
    }

    // ── Wheel spin (Physics/Kinematic) ─────────────────────────────────────────
    // dist is in world units; convert to local (pre-scale) before dividing by radius.
    const localDist = dist / this.scale;
    // Negative: rotate(+θ, 0,0,1) sends the wheel's top toward -x. For forward
    // rolling we need the top moving +x, so the spin angle decreases as the
    // wagon advances.
    this.frontWheel.spinAngle -= localDist / FRONT_WHEEL_RADIUS;
    this.backWheel.spinAngle  -= localDist / BACK_WHEEL_RADIUS;

    // ── Horse follow ──────────────────────────────────────────────────────────
    this._updateHorsePositions();

    // ── Hay Bale pickup / drop (separate keys, edge-triggered) ────────────────
    const pNow = iface.isKeyPressed('KeyP');
    const lNow = iface.isKeyPressed('KeyL');

    // P — pick up nearest bale (also works mid-drop, cancelling the animation)
    if (pNow && !this._pPressedLast && this.carriedBales.length < 2 && this.scene.haybales) {
        const PICKUP_RADIUS = 6.0;
        let nearest = null, nearestDist = Infinity;
        for (const bale of this.scene.haybales) {
            // Allow picking up a bale that's mid-drop (cancel animation)
            if (bale.isPickedUp && !(bale.dropAnimator && bale.dropAnimator.active)) continue;
            // Also skip bales we are already carrying
            if (this.carriedBales.includes(bale)) continue;

            const dx = bale.x - this.x;
            const dz = bale.z - this.z;
            const d  = Math.sqrt(dx * dx + dz * dz);
            if (d < PICKUP_RADIUS && d < nearestDist) {
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

    // L — drop the carried bale (drops the most recently picked up one)
    if (lNow && !this._lPressedLast && this.carriedBales.length > 0) {
        // Pop the bale. Its index in the wagon was `this.carriedBales.length`.
        const i = this.carriedBales.length - 1;
        const bale = this.carriedBales.pop();

        // Calculate the world coordinates of the bale as it sits in the wagon
        const offsetMultiplier = (i === 0) ? 0.15 : -0.15;
        const localX = -BED_LENGTH * offsetMultiplier;
        // Bale is now centred at the anchor — drop coords match carry coords.
        const localZ = -0.5;

        const scaledX = localX * this.scale;
        const scaledZ = localZ * this.scale;

        const cy = Math.cos(this.yaw);
        const sy = Math.sin(this.yaw);

        const rotX = scaledX * cy + scaledZ * sy;
        const rotZ = -scaledX * sy + scaledZ * cy;

        // Update the bale's actual world position and orientation
        bale.x = this.x + rotX;
        bale.z = this.z + rotZ;
        bale.yaw = this.yaw;

        bale.groundY = this.scene.terrain?.heightAt(bale.x, bale.z) ?? this.y;
        bale.renderY = this.y + this.BALE_CARRY_Y * this.scale;

        bale.dropAnimator = new MyHayBaleAnimator(bale, bale.renderY, bale.groundY);
        bale.dropAnimator.enable(this.scene.time);
    }

    this._pPressedLast = pNow;
    this._lPressedLast = lNow;

    // Update carried bales: we only update their state here.
    // They are rendered in local space in display() so they stay perfectly in the wagon.
    for (let i = 0; i < this.carriedBales.length; i++) {
        const c = this.carriedBales[i];
        c.renderY = this.y + this.BALE_CARRY_Y * this.scale;
    }

    // Tick any active drop animators
    if (this.scene.haybales) {
        for (const bale of this.scene.haybales) {
            if (bale.dropAnimator && bale.dropAnimator.active) {
                bale.dropAnimator.update(this.scene.time);
                if (!bale.dropAnimator.active) {
                    bale.isPickedUp = false;
                    bale.renderY    = bale.groundY;
                    // Signal to MyScene that this bale just touched down
                    bale._justLanded = true;
                }
            }
        }
    }
  }

  _triggerCollisionDamage(minDmg, maxDmg) {
      const dmg = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
      this.hp = Math.max(0, this.hp - dmg);
      this.scene.uiDamage = dmg;
      this.invulnerabilityTimer = 1.0; // 1 second i-frames
      
      // Knockback: Reverse speed to give maneuvering room.
      this.speed = -MAX_SPEED * 0.9; 
      
      // Trigger a camera shake on the scene
      this.scene.cameraShake = 1.0;
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

    // Cover sits on the top horizontal plank of the new side rails (RAIL_HEIGHT * 0.8)
    this.scene.pushMatrix();
    this.scene.translate(-BED_LENGTH * 0.25, BACK_WHEEL_RADIUS + BED_HEIGHT + RAIL_HEIGHT * 0.8, 0);
    this.cover.display();
    this.scene.popMatrix();

    // Render carried hay bales in wagon-local space using the bale's baked mesh.
    for (let i = 0; i < this.carriedBales.length; i++) {
        const bale = this.carriedBales[i];
        const offsetMultiplier = (i === 0) ? 0.15 : -0.15;
        const localX = -BED_LENGTH * offsetMultiplier;
        // Bale geometry is centred at origin with long axis along +X. Rotate
        // -π/2 around +Y to lay it across the bed (long axis → wagon +Z), and
        // lift by RADIUS*scale so the cylinder side rests on the bed floor.
        this.scene.pushMatrix();
        this.scene.translate(localX, this.BALE_CARRY_Y + bale.RADIUS * bale.scale, -0.5);
        this.scene.rotate(-Math.PI / 2, 0, 1, 0);
        this.scene.scale(bale.scale, bale.scale, bale.scale);
        bale.drawMesh();
        this.scene.popMatrix();
    }

    // Tongue tucked under the bed front so it visually attaches to the wagon.
    this.scene.pushMatrix();
    this.scene.translate(BED_LENGTH * 0.5, BACK_WHEEL_RADIUS + BED_HEIGHT * 0.4, 0);
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

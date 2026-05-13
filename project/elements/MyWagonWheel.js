import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const DEFAULT_THICKNESS = 0.15;

const SLICES         = 16;   // around the rim / hub
const N_SPOKES       = 8;
const HUB_FRAC       = 0.15; // hub radius / wheel radius
const RIM_INNER_FRAC = 0.92; // inner rim radius / wheel radius (where spokes meet rim)
const SPOKE_TANG_FRAC  = 0.06; // spoke tangential thickness / wheel radius
const SPOKE_AXIAL_FRAC = 0.55; // spoke axial thickness / wheel thickness

// Wagon wheel as actual geometry — outer rim, central hub, and N radial
// spoke bars baked into a single mesh in initBuffers(). The whole mesh
// rotates as a unit via the outer rotate(spinAngle) in display().
//
// Local frame: axle along +z, wheel lies in the xy plane.
export class MyWagonWheel extends CGFobject {
  constructor(scene, radius, thickness = DEFAULT_THICKNESS, texture) {
    super(scene);
    this.radius    = radius;
    this.thickness = thickness;

    // Cumulative rolling angle (radians). Grows unbounded — sin/cos handle it.
    this.spinAngle = 0;

    // Near-white so the wood texture comes through with its own colour.
    this.appearance = new CGFappearance(scene);
    this.appearance.setAmbient(0.40, 0.40, 0.40, 1.0);
    this.appearance.setDiffuse(0.90, 0.90, 0.90, 1.0);
    this.appearance.setSpecular(0.05, 0.05, 0.05, 1.0);
    this.appearance.setShininess(6.0);
    if (texture) {
      this.appearance.setTexture(texture);
      this.appearance.setTextureWrap('REPEAT', 'REPEAT');
    }

    this.initBuffers();
  }

  initBuffers() {
    this.vertices  = [];
    this.normals   = [];
    this.texCoords = [];
    this.indices   = [];

    const R = this.radius;
    const T = this.thickness;
    const HUB_R     = R * HUB_FRAC;
    const RIM_INNER = R * RIM_INNER_FRAC;
    const SPOKE_W   = R * SPOKE_TANG_FRAC;
    const SPOKE_D   = T * SPOKE_AXIAL_FRAC;

    // Outer rim surface (normals point radially outward).
    this._emitCylinderSide(R, T, /* normalSign */ +1);
    // Hub surface (also outward-facing — the hub is a small solid post).
    this._emitCylinderSide(HUB_R, T, /* normalSign */ +1);

    // Spokes: thin boxes between hub and inner-rim, evenly spaced.
    const spokeMid = (HUB_R + RIM_INNER) * 0.5;
    const spokeLen =  RIM_INNER - HUB_R;
    for (let i = 0; i < N_SPOKES; i++) {
      const theta = (i / N_SPOKES) * 2 * Math.PI;
      this._emitSpokeBox(theta, spokeMid, spokeLen, SPOKE_W, SPOKE_D);
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  // Open cylinder side around the z-axis. radius r, full thickness t centred at z=0.
  _emitCylinderSide(r, t, normalSign) {
    const base = this.vertices.length / 3;
    for (let s = 0; s <= SLICES; s++) {
      const theta = (s / SLICES) * 2 * Math.PI;
      const cx = Math.cos(theta), sy = Math.sin(theta);
      for (const z of [-t / 2, t / 2]) {
        this.vertices.push(cx * r, sy * r, z);
        this.normals.push(normalSign * cx, normalSign * sy, 0);
        this.texCoords.push(s / SLICES, (z + t / 2) / t);
      }
    }
    // Two verts per slice (low z, high z). Wind so the outward face is front.
    for (let s = 0; s < SLICES; s++) {
      const bl = base + s * 2;
      const tl = base + s * 2 + 1;
      const br = base + s * 2 + 2;
      const tr = base + s * 2 + 3;
      this.indices.push(bl, br, tl);
      this.indices.push(tl, br, tr);
    }
  }

  // Box-shaped spoke laid radially at angle theta. Skips the two end faces
  // because they're hidden inside the hub and the rim.
  _emitSpokeBox(theta, midR, len, w, d) {
    const c = Math.cos(theta), s = Math.sin(theta);
    const hLen = len * 0.5, hW = w * 0.5, hD = d * 0.5;

    // Spoke-local axes: u along radial (+x in local), v tangential (+y), n axial (+z).
    // In wheel space, u = (c, s, 0), v = (-s, c, 0), n = (0, 0, 1).
    const ux = c,  uy = s,  uz = 0;
    const vx = -s, vy = c,  vz = 0;
    const nx = 0,  ny = 0,  nz = 1;

    // Centre of the box in wheel space.
    const cx = ux * midR, cy = uy * midR, cz = 0;

    const v = (du, dv, dn) => [
      cx + ux * du + vx * dv + nx * dn,
      cy + uy * du + vy * dv + ny * dn,
      cz + uz * du + vz * dv + nz * dn,
    ];

    // 4 faces (axial top, axial bottom, tangential +, tangential -).
    // (Skip radial-inner and radial-outer faces — hidden inside hub/rim.)
    this._emitQuad(
      v(-hLen, -hW, +hD), v(+hLen, -hW, +hD), v(+hLen, +hW, +hD), v(-hLen, +hW, +hD),
      [nx, ny, nz]
    );
    this._emitQuad(
      v(-hLen, +hW, -hD), v(+hLen, +hW, -hD), v(+hLen, -hW, -hD), v(-hLen, -hW, -hD),
      [-nx, -ny, -nz]
    );
    this._emitQuad(
      v(-hLen, +hW, +hD), v(+hLen, +hW, +hD), v(+hLen, +hW, -hD), v(-hLen, +hW, -hD),
      [vx, vy, vz]
    );
    this._emitQuad(
      v(-hLen, -hW, -hD), v(+hLen, -hW, -hD), v(+hLen, -hW, +hD), v(-hLen, -hW, +hD),
      [-vx, -vy, -vz]
    );
  }

  _emitQuad(p0, p1, p2, p3, n) {
    const base = this.vertices.length / 3;
    this.vertices.push(...p0, ...p1, ...p2, ...p3);
    for (let i = 0; i < 4; i++) this.normals.push(n[0], n[1], n[2]);
    this.texCoords.push(0, 0, 1, 0, 1, 1, 0, 1);
    this.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  display() {
    this.appearance.apply();

    this.scene.pushMatrix();
    // Whole baked mesh spins as a unit around the axle (+z).
    this.scene.rotate(this.spinAngle, 0, 0, 1);
    super.display();
    this.scene.popMatrix();
  }
}

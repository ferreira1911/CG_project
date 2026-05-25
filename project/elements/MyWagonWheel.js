import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const DEFAULT_THICKNESS = 0.15;

const SLICES         = 32;
const N_SPOKES       = 8;
const HUB_FRAC       = 0.15;
const RIM_INNER_FRAC = 0.92;
const SPOKE_TANG_FRAC  = 0.06;
const SPOKE_AXIAL_FRAC = 0.55;

// Wagon wheel as actual geometry — outer rim, central hub, and N radial
// spoke bars all baked into a single mesh. The whole mesh spins as a unit
// via the outer rotate(spinAngle) in display().
//
// Local frame: axle along +Z, wheel lies in the XY plane.
export class MyWagonWheel extends CGFobject {
  constructor(scene, radius, thickness = DEFAULT_THICKNESS, texture) {
    super(scene);
    this.radius    = radius;
    this.thickness = thickness;

    // Cumulative rolling angle (rad). Grows unbounded; sin/cos handle it.
    this.spinAngle = 0;

    // Near-white diffuse lets the wood texture supply its own colour.
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

    // Outer rim (open cylinder, outward normals) + hub (small solid post).
    this._emitCylinderSide(R, T, +1);
    this._emitCylinderSide(HUB_R, T, +1);

    // Evenly spaced spokes joining hub outer face to rim inner face.
    const spokeMid = (HUB_R + RIM_INNER) * 0.5;
    const spokeLen = RIM_INNER - HUB_R;
    for (let i = 0; i < N_SPOKES; i++) {
      const theta = (i / N_SPOKES) * 2 * Math.PI;
      this._emitSpokeBox(theta, spokeMid, spokeLen, SPOKE_W, SPOKE_D);
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }

  // Open cylinder side around the Z-axis, double-sided so the rim is visible
  // from inside the wheel too.
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
    for (let s = 0; s < SLICES; s++) {
      const bl = base + s * 2;
      const tl = base + s * 2 + 1;
      const br = base + s * 2 + 2;
      const tr = base + s * 2 + 3;
      // Outward face (CCW from outside) then inward (CCW from inside).
      this.indices.push(bl, br, tl);
      this.indices.push(tl, br, tr);
      this.indices.push(bl, tl, br);
      this.indices.push(tl, tr, br);
    }
  }

  // Box-shaped spoke laid radially at angle theta. End faces are skipped —
  // they're hidden inside the hub and the rim.
  _emitSpokeBox(theta, midR, len, w, d) {
    const c = Math.cos(theta), s = Math.sin(theta);
    const hLen = len * 0.5, hW = w * 0.5, hD = d * 0.5;

    // Spoke-local axes: u radial, v tangential, n axial.
    const ux = c,  uy = s,  uz = 0;
    const vx = -s, vy = c,  vz = 0;
    const nx = 0,  ny = 0,  nz = 1;

    const cx = ux * midR, cy = uy * midR, cz = 0;
    const v = (du, dv, dn) => [
      cx + ux * du + vx * dv + nx * dn,
      cy + uy * du + vy * dv + ny * dn,
      cz + uz * du + vz * dv + nz * dn,
    ];

    // 4 visible faces: axial top, axial bottom, tangential +, tangential -.
    this._emitQuad(v(-hLen, -hW, +hD), v(+hLen, -hW, +hD), v(+hLen, +hW, +hD), v(-hLen, +hW, +hD), [nx, ny, nz]);
    this._emitQuad(v(-hLen, +hW, -hD), v(+hLen, +hW, -hD), v(+hLen, -hW, -hD), v(-hLen, -hW, -hD), [-nx, -ny, -nz]);
    this._emitQuad(v(-hLen, +hW, +hD), v(+hLen, +hW, +hD), v(+hLen, +hW, -hD), v(-hLen, +hW, -hD), [vx, vy, vz]);
    this._emitQuad(v(-hLen, -hW, -hD), v(+hLen, -hW, -hD), v(+hLen, -hW, +hD), v(-hLen, -hW, +hD), [-vx, -vy, -vz]);
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
    this.scene.rotate(this.spinAngle, 0, 0, 1);
    super.display();
    this.scene.popMatrix();
  }
}

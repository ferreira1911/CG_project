import { CGFobject } from '../../lib/CGF.js';
import { MyUnitCube } from '../geometric/MyUnitCube.js';
import { MyQuad } from '../geometric/MyQuad.js';
import { MyBarnArea } from './MyBarnArea.js';
import { MyPrism } from '../geometric/MyPrism.js';
import { MyCircle } from '../geometric/MyCircle.js';

const WINDOW_SIZE = 2.5;
const Z_FIGHT_EPS = 0.05;  // tiny offset to keep facades off the body's face plane

export class MyBarn extends CGFobject {
  constructor(scene, x, y, z, yaw, textures) {
    super(scene);
    this.x = x; this.y = y; this.z = z;
    this.yaw = yaw;

    this.width      = 12;
    this.height     = 8;
    this.depth      = 16;
    this.roofHeight = 5;

    this.body      = new MyUnitCube(scene);
    this.quad      = new MyQuad(scene);
    this.roofPrism = new MyPrism(scene, 3, 1);  // triangular prism for the gable roof
    this.roofCap   = new MyCircle(scene, 3);

    // Drop-off ring sits in front of the barn along its local +Z. The +2
    // pushes it past the roof overhang.
    this.dropOffRadius = 8;
    this.area          = new MyBarnArea(scene, this.dropOffRadius);
    this.areaOffsetZ   = this.depth / 2 + this.dropOffRadius + 2;

    this.woodTex   = textures.wood;
    this.frontTex  = textures.front;
    this.roofTex   = textures.roof;
    this.windowTex = textures.window || null;
  }

  // Updates the drop-off ring's highlight state if the wagon is overlapping it.
  checkWagonIntersection(wagonX, wagonZ, wagonRadius) {
    const [ax, az] = this._dropOffWorldCenter();
    const dx = wagonX - ax, dz = wagonZ - az;
    const minDist = this.dropOffRadius + wagonRadius;
    this.area.isIntersected = dx * dx + dz * dz < minDist * minDist;
    return this.area.isIntersected;
  }

  // True if a world-space point lies inside the drop-off circle.
  checkPointInDropOff(x, z) {
    const [ax, az] = this._dropOffWorldCenter();
    const dx = x - ax, dz = z - az;
    return dx * dx + dz * dz < this.dropOffRadius * this.dropOffRadius;
  }

  _dropOffWorldCenter() {
    const cy = Math.cos(this.yaw);
    const sy = Math.sin(this.yaw);
    return [this.x + this.areaOffsetZ * sy, this.z + this.areaOffsetZ * cy];
  }

  display() {
    this.scene.pushMatrix();
    this.scene.translate(this.x, this.y, this.z);
    this.scene.rotate(this.yaw, 0, 1, 0);

    this._displayBody();
    this._displayFrontFacade();
    this._displaySideWindows();
    this._displayRoof();
    this._displayDropOffArea();

    this.scene.popMatrix();
  }

  _displayBody() {
    this.scene.pushMatrix();
    this.scene.translate(0, this.height / 2, 0);
    this.scene.scale(this.width, this.height, this.depth);
    if (this.woodTex) this.woodTex.bind();
    this.body.display();
    this.scene.popMatrix();
  }

  _displayFrontFacade() {
    if (!this.frontTex) return;
    this.scene.pushMatrix();
    this.scene.translate(0, this.height / 2, this.depth / 2 + Z_FIGHT_EPS);
    // Negative scales flip the quad on both axes to match the texture's
    // expected orientation (texture is authored upside-down + mirrored).
    this.scene.scale(-this.width, -this.height, 1);
    this.frontTex.bind();
    this.quad.display();
    this.scene.popMatrix();
  }

  _displaySideWindows() {
    if (!this.windowTex) return;
    this.windowTex.bind();

    // Right wall (+X), face outward along +X.
    this.scene.pushMatrix();
    this.scene.translate(this.width / 2 + Z_FIGHT_EPS, this.height * 0.55, 0);
    this.scene.rotate(Math.PI / 2, 0, 1, 0);
    this.scene.scale(-WINDOW_SIZE, -WINDOW_SIZE, 1);
    this.quad.display();
    this.scene.popMatrix();

    // Left wall (-X), face outward along -X.
    this.scene.pushMatrix();
    this.scene.translate(-this.width / 2 - Z_FIGHT_EPS, this.height * 0.55, 0);
    this.scene.rotate(-Math.PI / 2, 0, 1, 0);
    this.scene.scale(-WINDOW_SIZE, -WINDOW_SIZE, 1);
    this.quad.display();
    this.scene.popMatrix();
  }

  _displayRoof() {
    if (this.roofTex) {
      this.roofTex.bind();
      this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_S, this.scene.gl.REPEAT);
      this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_T, this.scene.gl.REPEAT);
    }

    // 3-sided prism = triangular cross-section. Local: base width √3, height 1.5,
    // depth along +Z. Rotating π/2 around Z stands the peak straight up.
    const prismHeight = 1.5;
    const prismWidth  = Math.sqrt(3);
    const scaleY = this.roofHeight / prismHeight;
    const scaleX = (this.width + 0.6) / prismWidth;  // 0.6 = roof overhang on X
    const scaleZ = this.depth + 0.4;                 // 0.4 = overhang on Z
    // The prism's base sits at local Y = -0.5; after scaleY, base is at
    // -0.5*scaleY. We want the base flush with the walls (Y = this.height).
    const originY = this.height + 0.5 * scaleY;

    this.scene.pushMatrix();
    this.scene.translate(0, originY, -this.depth / 2 - 0.2);  // -0.2 centres the Z overhang
    this.scene.scale(scaleX, scaleY, scaleZ);
    this.scene.rotate(Math.PI / 2, 0, 0, 1);
    this.roofPrism.display();

    // Caps want clamped wrap so the triangle texture doesn't tile across them.
    if (this.roofTex) {
      this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_S, this.scene.gl.CLAMP_TO_EDGE);
      this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_T, this.scene.gl.CLAMP_TO_EDGE);
    }

    this.scene.pushMatrix();
    this.scene.translate(0, 0, 1);  // front cap at the prism's +Z end
    this.roofCap.display();
    this.scene.popMatrix();

    this.scene.pushMatrix();
    this.scene.rotate(Math.PI, 1, 0, 0);  // back cap faces -Z without flipping the peak
    this.roofCap.display();
    this.scene.popMatrix();

    this.scene.popMatrix();
  }

  _displayDropOffArea() {
    this.scene.pushMatrix();
    // Lift by 0.1 to avoid Z-fighting with the terrain.
    this.scene.translate(0, 0.1, this.areaOffsetZ);
    this.area.display();
    this.scene.popMatrix();
  }
}

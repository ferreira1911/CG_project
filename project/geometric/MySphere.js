import { CGFobject } from '../../lib/CGF.js';

/**
 * MySphere
 * @constructor
 * @param scene   - Reference to MyScene object
 * @param radius  - sphere radius
 * @param slices  - divisions around the Y axis
 * @param stacks  - divisions from top to bottom
 * @param inside  - if true, normals + winding are inverted (for sky-dome / panorama use)
 * @param north   - vertical scale factor applied to the upper hemisphere (1 = full, 0 = flat)
 * @param south   - vertical scale factor applied to the lower hemisphere (1 = full, 0 = flat)
 */
export class MySphere extends CGFobject {
  constructor(scene, radius = 1, slices = 32, stacks = 16, inside = false, north = 1, south = 1) {
    super(scene);
    this.radius = radius;
    this.slices = slices;
    this.stacks = stacks;
    this.sign = inside ? -1 : 1;
    this.north = north;
    this.south = south;
    this.initBuffers();
  }

  initBuffers() {
    this.vertices = [];
    this.indices = [];
    this.normals = [];
    this.texCoords = [];

    const phiInc = Math.PI / this.stacks;
    const thetaInc = (2 * Math.PI) / this.slices;
    const latVertices = this.slices + 1;

    let phi = 0;
    for (let stack = 0; stack <= this.stacks; stack++) {
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);
      const yFactor = cosPhi >= 0 ? this.north : this.south;

      let theta = 0;
      for (let slice = 0; slice <= this.slices; slice++) {
        const x = Math.cos(theta) * sinPhi;
        const y = cosPhi;
        const z = Math.sin(theta) * sinPhi;

        this.vertices.push(this.radius * x, this.radius * y * yFactor, this.radius * z);
        this.normals.push(this.sign * x, this.sign * y, this.sign * z);
        this.texCoords.push(slice / this.slices, stack / this.stacks);

        theta += thetaInc;
      }
      phi += phiInc;
    }

    for (let stack = 0; stack < this.stacks; stack++) {
      for (let slice = 0; slice < this.slices; slice++) {
        const first = stack * latVertices + slice;
        const second = first + latVertices;

        if (this.sign === 1) {
          this.indices.push(first + 1, second + 1, second);
          this.indices.push(first, first + 1, second);
        } else {
          this.indices.push(second, second + 1, first + 1);
          this.indices.push(second, first + 1, first);
        }
      }
    }

    this.primitiveType = this.scene.gl.TRIANGLES;
    this.initGLBuffers();
  }
}

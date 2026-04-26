import {CGFobject} from '../../lib/CGF.js';

export class MyLeafCluster extends CGFobject {
	constructor(scene) {
		super(scene);
		this.initBuffers();
	}
	
	initBuffers() {
		this.vertices = [];
		this.indices = [];
		this.normals = [];
		this.texCoords = [];

		// Create 3 intersecting quads rotated by 0, 60, and 120 degrees around the Y axis
		const angles = [0, Math.PI / 3, 2 * Math.PI / 3];
		let offset = 0;

		for (let i = 0; i < angles.length; i++) {
			const angle = angles[i];
			const cosA = Math.cos(angle);
			const sinA = Math.sin(angle);

			// Helper to rotate a point around Y axis
			const rotY = (x, y, z) => {
				return [
					x * cosA + z * sinA,
					y,
					-x * sinA + z * cosA
				];
			};

			// Helper to rotate a normal around Y axis
			const rotNormal = (nx, ny, nz) => {
				return [
					nx * cosA + nz * sinA,
					ny,
					-nx * sinA + nz * cosA
				];
			};

			// Original Quad Vertices (Front: 0..3, Back: 4..7)
			const v0 = rotY(-0.5, -0.5, 0);
			const v1 = rotY( 0.5, -0.5, 0);
			const v2 = rotY(-0.5,  0.5, 0);
			const v3 = rotY( 0.5,  0.5, 0);

			this.vertices.push(
				...v0, ...v1, ...v2, ...v3, // Front
				...v0, ...v1, ...v2, ...v3  // Back
			);

			const nFront = rotNormal(0, 0, 1);
			const nBack = rotNormal(0, 0, -1);

			this.normals.push(
				...nFront, ...nFront, ...nFront, ...nFront,
				...nBack, ...nBack, ...nBack, ...nBack
			);

			this.texCoords.push(
				0, 1,  1, 1,  0, 0,  1, 0, // Front
				0, 1,  1, 1,  0, 0,  1, 0  // Back
			);

			this.indices.push(
				// Front
				offset + 0, offset + 1, offset + 2,
				offset + 1, offset + 3, offset + 2,
				// Back
				offset + 6, offset + 5, offset + 4,
				offset + 6, offset + 7, offset + 5
			);

			offset += 8;
		}

		this.primitiveType = this.scene.gl.TRIANGLES;
		this.initGLBuffers();
	}
}

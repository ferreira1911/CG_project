import {CGFobject} from '../../lib/CGF.js';
/**
 * MyQuad
 * @constructor
 * @param {MyScene} scene - Reference to MyScene object
 * @param {Array} coords - Array of texture coordinates (optional)
 */
export class MyQuad extends CGFobject {
	constructor(scene) {
		super(scene);
		this.initBuffers();
		
	}
	
	initBuffers() {
		this.vertices = [
			// Front face (+Z), 0..3
			-0.5, -0.5, 0,
			 0.5, -0.5, 0,
			-0.5,  0.5, 0,
			 0.5,  0.5, 0,
			// Back face (-Z), 4..7 — same positions, separate verts so normals can differ
			-0.5, -0.5, 0,
			 0.5, -0.5, 0,
			-0.5,  0.5, 0,
			 0.5,  0.5, 0
		];

		this.indices = [
			// Front: CCW when viewed from +Z
			0, 1, 2,
			1, 3, 2,
			// Back: reversed winding so it's CCW when viewed from -Z
			6, 5, 4,
			6, 7, 5
		];

		this.normals = [
			// Front
			0, 0,  1,
			0, 0,  1,
			0, 0,  1,
			0, 0,  1,
			// Back
			0, 0, -1,
			0, 0, -1,
			0, 0, -1,
			0, 0, -1
		];

		this.texCoords = [
			0, 1,
			1, 1,
			0, 0,
			1, 0,
			0, 1,
			1, 1,
			0, 0,
			1, 0
		];

		this.primitiveType = this.scene.gl.TRIANGLES;
		this.initGLBuffers();
	}

	
}


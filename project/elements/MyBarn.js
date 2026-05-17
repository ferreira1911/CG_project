import { CGFobject } from '../../lib/CGF.js';
import { MyUnitCube } from '../geometric/MyUnitCube.js';
import { MyQuad } from '../geometric/MyQuad.js';
import { MyGable } from '../geometric/MyGable.js';
import { MyBarnArea } from './MyBarnArea.js';

export class MyBarn extends CGFobject {
    constructor(scene, x, y, z, yaw, textures) {
        super(scene);
        this.x = x;
        this.y = y;
        this.z = z;
        this.yaw = yaw;

        // Dimensions
        this.width = 12;
        this.height = 8;
        this.depth = 16;
        this.roofHeight = 5;

        // Components
        this.body = new MyUnitCube(scene);
        this.quad = new MyQuad(scene);
        this.gable = new MyGable(scene);
        
        // Circular drop-off area in front of the barn
        this.dropOffRadius = 8;
        this.area = new MyBarnArea(scene, this.dropOffRadius);
        
        // Relative position of the area (in front of the barn along local +Z)
        this.areaOffsetZ = this.depth / 2 + this.dropOffRadius + 2;

        // Textures
        this.woodTex = textures.wood;
        this.frontTex = textures.front;
        this.roofTex = textures.roof;

        // Precalculate slope parameters
        const halfWidth = this.width / 2;
        this.slopeLength = Math.sqrt(halfWidth * halfWidth + this.roofHeight * this.roofHeight);
        this.slopeAngle = Math.atan2(this.roofHeight, halfWidth);
    }

    /**
     * Check if the wagon is inside the drop-off area.
     * Updates the area's visual state.
     */
    checkWagonIntersection(wagonX, wagonZ, wagonRadius) {
        // Calculate the world coordinates of the drop-off area center
        const cy = Math.cos(this.yaw);
        const sy = Math.sin(this.yaw);
        
        const areaWorldX = this.x + this.areaOffsetZ * sy;
        const areaWorldZ = this.z + this.areaOffsetZ * cy;

        const dx = wagonX - areaWorldX;
        const dz = wagonZ - areaWorldZ;
        const distSq = dx * dx + dz * dz;

        const minDist = this.dropOffRadius + wagonRadius;
        
        this.area.isIntersected = distSq < minDist * minDist;
        return this.area.isIntersected;
    }

    display() {
        this.scene.pushMatrix();
        this.scene.translate(this.x, this.y, this.z);
        this.scene.rotate(this.yaw, 0, 1, 0);

        // --- Body ---
        this.scene.pushMatrix();
        // Cube is centered at origin. Move up so bottom is at Y=0
        this.scene.translate(0, this.height / 2, 0);
        this.scene.scale(this.width, this.height, this.depth);
        
        if (this.woodTex) this.woodTex.bind();
        this.body.display();
        this.scene.popMatrix();

        // --- Front Facade Override ---
        if (this.frontTex) {
            this.scene.pushMatrix();
            // Move slightly in front of the +Z face to avoid z-fighting
            this.scene.translate(0, this.height / 2, this.depth / 2 + 0.05);
            // The image might be upside down if simply mapped, so we scale Y by -1 to flip it right-side up
            this.scene.scale(this.width, -this.height, 1);
            this.frontTex.bind();
            this.quad.display();
            this.scene.popMatrix();
        }

        // --- A-Frame Roof ---
        if (this.roofTex) {
            this.roofTex.bind();
            // Repeat texture for better look
            this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_S, this.scene.gl.REPEAT);
            this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_T, this.scene.gl.REPEAT);
        }

        const halfWidth = this.width / 2;
        const midY = this.height + this.roofHeight / 2;

        // Right Slope (+X side)
        this.scene.pushMatrix();
        this.scene.translate(halfWidth / 2, midY, 0); // Midpoint of the right slope
        this.scene.rotate(-this.slopeAngle, 0, 0, 1);  // Tilt (peak at X=0 is higher than X=6)
        this.scene.rotate(-Math.PI / 2, 1, 0, 0);     // Lay flat along Z
        this.scene.scale(this.slopeLength, this.depth + 0.2, 1); // +0.2 for slight overhang
        this.quad.display();
        
        // Render the underside of the roof
        this.scene.rotate(Math.PI, 0, 1, 0);
        this.quad.display();
        this.scene.popMatrix();

        // Left Slope (-X side)
        this.scene.pushMatrix();
        this.scene.translate(-halfWidth / 2, midY, 0); // Midpoint of the left slope
        this.scene.rotate(this.slopeAngle, 0, 0, 1);  // Tilt opposite
        this.scene.rotate(-Math.PI / 2, 1, 0, 0);      // Lay flat along Z
        this.scene.scale(this.slopeLength, this.depth + 0.2, 1);
        this.quad.display();
        
        // Render the underside
        this.scene.rotate(Math.PI, 0, 1, 0);
        this.quad.display();
        this.scene.popMatrix();

        // Restore texture wrapping
        if (this.roofTex) {
            this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_S, this.scene.gl.CLAMP_TO_EDGE);
            this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_T, this.scene.gl.CLAMP_TO_EDGE);
        }

        // --- Gables (triangles filling the space under the roof) ---
        if (this.woodTex) this.woodTex.bind();
        
        // Front Gable
        this.scene.pushMatrix();
        this.scene.translate(0, this.height, this.depth / 2);
        this.scene.scale(this.width, this.roofHeight, 1);
        this.gable.display();
        this.scene.popMatrix();

        // Back Gable
        this.scene.pushMatrix();
        this.scene.translate(0, this.height, -this.depth / 2);
        this.scene.scale(this.width, this.roofHeight, 1);
        this.scene.rotate(Math.PI, 0, 1, 0); // Face backwards
        this.gable.display();
        this.scene.popMatrix();


        // --- Drop-Off Area ---
        this.scene.pushMatrix();
        // Placed on the ground in front of the barn (+Z direction in local space)
        // Elevate slightly to avoid Z-fighting with terrain
        this.scene.translate(0, 0.1, this.areaOffsetZ);
        this.area.display();
        this.scene.popMatrix();

        this.scene.popMatrix();
    }
}

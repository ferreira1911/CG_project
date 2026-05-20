import { CGFobject } from '../../lib/CGF.js';
import { MyUnitCube } from '../geometric/MyUnitCube.js';
import { MyQuad } from '../geometric/MyQuad.js';
import { MyGable } from '../geometric/MyGable.js';
import { MyBarnArea } from './MyBarnArea.js';
import { MyPrism } from '../geometric/MyPrism.js';
import { MyCircle } from '../geometric/MyCircle.js';

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
        // Half prism roof uses a 3-sided prism (triangular)
        this.roofPrism = new MyPrism(scene, 3, 1);
        this.roofCap = new MyCircle(scene, 3);
        
        // Circular drop-off area in front of the barn
        this.dropOffRadius = 8;
        this.area = new MyBarnArea(scene, this.dropOffRadius);
        
        // Relative position of the area (in front of the barn along local +Z)
        this.areaOffsetZ = this.depth / 2 + this.dropOffRadius + 2;

        // Textures
        this.woodTex = textures.wood;
        this.frontTex = textures.front;
        this.roofTex = textures.roof;
        this.windowTex = textures.window || null;

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

    /**
     * Returns true if a world-space point (x, z) is inside the drop-off circle.
     * Used to detect whether a dropped bale landed inside the barn delivery zone.
     */
    checkPointInDropOff(x, z) {
        const cy = Math.cos(this.yaw);
        const sy = Math.sin(this.yaw);
        const areaWorldX = this.x + this.areaOffsetZ * sy;
        const areaWorldZ = this.z + this.areaOffsetZ * cy;
        const dx = x - areaWorldX;
        const dz = z - areaWorldZ;
        return (dx * dx + dz * dz) < (this.dropOffRadius * this.dropOffRadius);
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
            // The image might be upside down or mirrored if simply mapped, so we scale Y by -1 and X by -1
            this.scene.scale(-this.width, -this.height, 1);
            this.frontTex.bind();
            this.quad.display();
            this.scene.popMatrix();
        }

        // --- Side Windows ---
        if (this.windowTex) {
            this.windowTex.bind();
            const windowSize = 2.5;

            // Right wall (+X)
            this.scene.pushMatrix();
            this.scene.translate(this.width / 2 + 0.05, this.height * 0.55, 0);
            this.scene.rotate(Math.PI / 2, 0, 1, 0); // Face outward (+X)
            // Flip X to match right-side up if needed, or normal scale
            this.scene.scale(windowSize, windowSize, 1);
            this.quad.display();
            this.scene.popMatrix();

            // Left wall (-X)
            this.scene.pushMatrix();
            this.scene.translate(-this.width / 2 - 0.05, this.height * 0.55, 0);
            this.scene.rotate(-Math.PI / 2, 0, 1, 0); // Face outward (-X)
            this.scene.scale(windowSize, windowSize, 1);
            this.quad.display();
            this.scene.popMatrix();
        }

        // --- Side Windows ---
        if (this.windowTex) {
            this.windowTex.bind();
            const windowSize = 2.5;

            // Right wall (+X)
            this.scene.pushMatrix();
            this.scene.translate(this.width / 2 + 0.05, this.height * 0.55, 0);
            this.scene.rotate(Math.PI / 2, 0, 1, 0); // Face outward (+X)
            this.scene.scale(-windowSize, -windowSize, 1); // Flip properly
            this.quad.display();
            this.scene.popMatrix();

            // Left wall (-X)
            this.scene.pushMatrix();
            this.scene.translate(-this.width / 2 - 0.05, this.height * 0.55, 0);
            this.scene.rotate(-Math.PI / 2, 0, 1, 0); // Face outward (-X)
            this.scene.scale(-windowSize, -windowSize, 1); // Flip properly
            this.quad.display();
            this.scene.popMatrix();
        }

        // --- Half-Prism Roof (Triangular) ---
        if (this.roofTex) {
            this.roofTex.bind();
            this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_S, this.scene.gl.REPEAT);
            this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_T, this.scene.gl.REPEAT);
        }

        // A 3-sided prism forms a triangle base.
        // We rotate it 90 degrees around Z so the point is exactly at the top (Y).
        // Original triangle base width = Math.sqrt(3) ~ 1.732, height = 1.5.
        const prismHeight = 1.5;
        const prismWidth = Math.sqrt(3);

        const scaleY = this.roofHeight / prismHeight;
        const scaleX = (this.width + 0.6) / prismWidth; // 0.6 is overhang
        const scaleZ = this.depth + 0.4; // 0.4 overhang on Z

        // The base of the triangle is at Y = -0.5 in its local coordinates.
        // After scaling by scaleY, the base is at Y = -0.5 * scaleY.
        // We want the base to sit exactly at this.height (top of barn walls).
        // So: origin_Y + (-0.5 * scaleY) = this.height  =>  origin_Y = this.height + 0.5 * scaleY.
        const originY = this.height + 0.5 * scaleY;

        this.scene.pushMatrix();
        // Move to the calculated origin, pushed back to the rear edge (Prism draws +Z)
        this.scene.translate(0, originY, -this.depth / 2 - 0.2); // -0.2 to center the Z overhang
        
        // Scale to desired dimensions
        this.scene.scale(scaleX, scaleY, scaleZ);
        
        // Rotate 90 degrees around Z to point the triangle upward
        this.scene.rotate(Math.PI / 2, 0, 0, 1);
        
        // Draw the main roof prism
        this.roofPrism.display();
        
        // Adjust texture wrapping for caps so they look clean
        if (this.roofTex) {
            this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_S, this.scene.gl.CLAMP_TO_EDGE);
            this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_T, this.scene.gl.CLAMP_TO_EDGE);
        }

        // Front Cap
        this.scene.pushMatrix();
        this.scene.translate(0, 0, 1); // Top of the prism (Z=1 in local space)
        this.roofCap.display();
        this.scene.popMatrix();

        // Back Cap
        this.scene.pushMatrix();
        this.scene.rotate(Math.PI, 1, 0, 0); // Face backwards without inverting the Z-rotated peak
        this.roofCap.display();
        this.scene.popMatrix();

        this.scene.popMatrix();

        // Restore texture wrapping
        if (this.roofTex) {
            this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_S, this.scene.gl.CLAMP_TO_EDGE);
            this.scene.gl.texParameteri(this.scene.gl.TEXTURE_2D, this.scene.gl.TEXTURE_WRAP_T, this.scene.gl.CLAMP_TO_EDGE);
        }


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

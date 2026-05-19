import { CGFobject, CGFappearance } from '../../lib/CGF.js';

const LENGTH = 2.2;  // long axis (+x in local)
const WIDTH  = 1.3;  // across   (z)
const HEIGHT = 1.3;  // up       (y)

/**
 * MyHayBale — rectangular square-bale shape sitting at world (x, y, z).
 * Geometry is the shared scene.cube primitive scaled to (LENGTH, HEIGHT, WIDTH)
 * at draw time, so all bales share one VBO and one draw call each.
 *
 * States:
 *   isPickedUp = false    → rendered at ground position
 *   isPickedUp = true     → rendered on top of the wagon bed
 *   dropAnimator active   → bale is falling from bed to ground
 */
export class MyHayBale extends CGFobject {
    constructor(scene, x, y, z, rotY = 0, scale = 1.0, material = null) {
        super(scene);
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotY    = rotY;
        this.scale   = scale;
        
        // Use a shared material provided by the scene to prevent WebGL stutter on spawn
        this.mat = material;

        this.groundY = y;
        this.renderY = y;

        this.isPickedUp   = false;
        this.dropAnimator = null;

        this.LENGTH = LENGTH;
        this.WIDTH  = WIDTH;
        this.HEIGHT = HEIGHT;
        this.RADIUS = HEIGHT * 0.5;
    }

    /**
     * World coords for the top centre of the bale, used to anchor the
     * guidance arrow above it.
     */
    getTopCenter() {
        const cy = this.y + this.HEIGHT * this.scale + 0.5;
        return [this.x, cy, this.z];
    }

    // Apply material + scale the shared cube to bale dimensions. Caller is
    // responsible for translate/rotate so this works in both world space
    // (standalone bales) and wagon-local space (carried bales).
    drawMesh() {
        const s = this.scene;
        this.mat.apply();
        s.pushMatrix();
        s.scale(this.LENGTH, this.HEIGHT, this.WIDTH);
        s.cube.display();
        s.popMatrix();
    }

    display() {
        const s = this.scene;
        s.pushMatrix();
        s.translate(this.x, this.renderY + this.HEIGHT * 0.5 * this.scale, this.z);
        s.rotate(this.rotY, 0, 1, 0);
        s.scale(this.scale, this.scale, this.scale);
        this.drawMesh();
        s.popMatrix();
    }
}

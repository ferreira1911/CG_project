import { CGFobject, CGFappearance, CGFtexture } from '../../lib/CGF.js';
import { MyCylinder } from '../geometric/MyCylinder.js';
import { MyCircle }   from '../geometric/MyCircle.js';

/**
 * MyHayBale
 * A round hay bale (cylinder on its side) sitting at world position (x, y, z).
 * 
 * States:
 *   isPickedUp = false  → rendered at ground position
 *   isPickedUp = true   → rendered on top of the wagon bed (position driven by wagon)
 *   dropAnimator active → bale is falling from bed to ground
 */
export class MyHayBale extends CGFobject {
    constructor(scene, x, y, z, rotY = 0, scale = 1.0, texture = null) {
        super(scene);
        this.x = x;
        this.y = y;
        this.z = z;
        this.rotY    = rotY;
        this.scale   = scale;
        this.texture = texture;  // CGFtexture passed from MyScene

        this.groundY = y;
        this.renderY = y;

        this.isPickedUp  = false;
        this.dropAnimator = null;

        this.RADIUS = 0.65;
        this.LENGTH = 2.2;
        this.body = new MyCylinder(scene, 18, 1);
        this.cap  = new MyCircle(scene, 18);

        this._initMaterial();
    }

    _initMaterial() {
        this.mat = new CGFappearance(this.scene);
        // Warm straw yellow tones
        this.mat.setAmbient(0.45, 0.35, 0.10, 1.0);
        this.mat.setDiffuse(0.80, 0.65, 0.20, 1.0);
        this.mat.setSpecular(0.05, 0.05, 0.02, 1.0);
        this.mat.setShininess(8);
        // Apply texture if provided; otherwise the material colour is used
        if (this.texture) {
            this.mat.setTexture(this.texture);
            this.mat.setTextureWrap('REPEAT', 'REPEAT');
        }
    }

    /**
     * Returns the world coordinates [x, y, z] for the top center of the hay bale.
     * Used for positioning UI markers like the guidance arrow above it.
     */
    getTopCenter() {
        const halfLen = this.LENGTH * this.scale * 0.5;
        const cx = this.x - Math.cos(this.rotY) * halfLen;
        const cz = this.z + Math.sin(this.rotY) * halfLen;
        // The top of the bale + a 0.5 unit vertical gap
        const cy = this.y + (this.RADIUS * this.scale * 2.0) + 0.5;
        return [cx, cy, cz];
    }

    display() {
        const s = this.scene;

        s.gl.disable(s.gl.CULL_FACE);

        s.pushMatrix();
        s.translate(this.x, this.renderY + this.RADIUS * this.scale, this.z);
        s.rotate(this.rotY, 0, 1, 0);
        s.rotate(Math.PI / 2, 0, 0, 1);

        this.mat.apply();

        // Body
        s.pushMatrix();
        s.scale(this.RADIUS * this.scale, this.LENGTH * this.scale, this.RADIUS * this.scale);
        this.body.display();
        s.popMatrix();

        // Top cap (at Y = LENGTH * scale)
        s.pushMatrix();
        s.translate(0, this.LENGTH * this.scale, 0);
        s.rotate(-Math.PI / 2, 1, 0, 0);
        s.scale(this.RADIUS * this.scale, this.RADIUS * this.scale, 1);
        this.cap.display();
        s.popMatrix();

        // Bottom cap (at Y = 0)
        s.pushMatrix();
        s.rotate(Math.PI / 2, 1, 0, 0);
        s.scale(this.RADIUS * this.scale, this.RADIUS * this.scale, 1);
        this.cap.display();
        s.popMatrix();

        s.popMatrix();

        s.gl.enable(s.gl.CULL_FACE);
    }
}

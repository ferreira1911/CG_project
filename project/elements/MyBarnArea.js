import { CGFobject, CGFappearance } from '../../lib/CGF.js';
import { MyCylinder } from '../geometric/MyCylinder.js';

export class MyBarnArea extends CGFobject {
    constructor(scene, radius) {
        super(scene);
        this.radius = radius;
        // Use a cylinder to create a hollow ring/aura instead of a filled circle
        this.aura = new MyCylinder(scene, 32, 1);
        
        // Default appearance (not intersected)
        this.idleApp = new CGFappearance(scene);
        this.idleApp.setAmbient(0.3, 0.3, 0.1, 1.0);
        this.idleApp.setDiffuse(0.6, 0.6, 0.2, 0.5); // Yellowish
        this.idleApp.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.idleApp.setEmission(0.4, 0.4, 0.0, 1.0);

        // Active appearance (intersected)
        this.activeApp = new CGFappearance(scene);
        this.activeApp.setAmbient(0.1, 0.4, 0.1, 1.0);
        this.activeApp.setDiffuse(0.2, 0.8, 0.2, 0.5); // Greenish
        this.activeApp.setSpecular(0.1, 0.1, 0.1, 1.0);
        this.activeApp.setEmission(0.0, 0.6, 0.0, 1.0);

        this.isIntersected = false;
    }

    display() {
        this.scene.pushMatrix();
        
        // Apply the correct material
        if (this.isIntersected) {
            this.activeApp.apply();
        } else {
            this.idleApp.apply();
        }

        // The cylinder is along the Y axis. We just need to scale it.
        // Scale X and Z to the radius, and Y to a small height for the aura ring.
        this.scene.scale(this.radius, 0.5, this.radius);

        // Enable blending for transparency
        this.scene.gl.enable(this.scene.gl.BLEND);
        this.scene.gl.blendFunc(this.scene.gl.SRC_ALPHA, this.scene.gl.ONE_MINUS_SRC_ALPHA);
        
        // Disable depth writing so the aura doesn't cause Z-fighting with the terrain
        this.scene.gl.depthMask(false);
        // Disable culling so the cylinder is visible from outside (CW winding fix)
        this.scene.gl.disable(this.scene.gl.CULL_FACE);

        // Unbind any textures so we just use the material color
        if (this.scene.activeTexture) {
             this.scene.activeTexture.unbind();
        }

        this.aura.display();

        // Restore state
        this.scene.gl.enable(this.scene.gl.CULL_FACE);
        this.scene.gl.depthMask(true);
        this.scene.gl.disable(this.scene.gl.BLEND);
        
        this.scene.popMatrix();
    }
}

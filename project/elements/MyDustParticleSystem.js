import { CGFappearance } from '../../lib/CGF.js';
import { MyUnitCube } from '../geometric/MyUnitCube.js';

export class MyDustParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.dustCube = new MyUnitCube(scene);
        this.dustMaterial = new CGFappearance(scene);
        this.dustMaterial.setAmbient(0.3, 0.25, 0.2, 1);
        this.dustMaterial.setDiffuse(0.4, 0.3, 0.2, 1); // Dirt brown
        this.dustMaterial.setEmission(0.1, 0.08, 0.05, 1);
        
        if (scene.cloudMap) {
            this.dustMaterial.setTexture(scene.cloudMap);
            this.dustMaterial.setTextureWrap('REPEAT', 'REPEAT');
        }
    }

    spawn(x, y, z, speed, yaw) {
        const cy = Math.cos(yaw), sy = Math.sin(yaw);
        // Kick dust slightly backwards relative to wagon
        const vx = -cy * speed * 0.3 + (Math.random() - 0.5) * 2.0;
        const vz = sy * speed * 0.3 + (Math.random() - 0.5) * 2.0;
        const vy = 1.0 + Math.random() * 2.0; // Shoot upwards

        this.particles.push({
            x: x, 
            y: y, 
            z: z,
            vx: vx,
            vy: vy,
            vz: vz,
            life: 0, 
            maxLife: 0.6 + Math.random() * 0.4,
            scale: 0.15 + Math.random() * 0.15, // Reduced from 0.4-0.8 to 0.15-0.30
            rotY: Math.random() * Math.PI * 2, 
            rotX: Math.random() * Math.PI * 2
        });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.life += dt;
            
            // Move based on velocity
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            
            // Apply drag (slows down horizontal movement) and billow (accelerates upwards)
            p.vx *= (1.0 - 2.0 * dt); 
            p.vz *= (1.0 - 2.0 * dt);
            p.vy += dt * 1.5; 
            
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
            }
        }
    }

    display() {
        if (this.particles.length > 0) {
            this.scene.gl.enable(this.scene.gl.BLEND);
            this.scene.gl.blendFunc(this.scene.gl.SRC_ALPHA, this.scene.gl.ONE_MINUS_SRC_ALPHA);
            this.dustMaterial.apply();
            
            for (const p of this.particles) {
                this.scene.pushMatrix();
                this.scene.translate(p.x, p.y, p.z);
                this.scene.rotate(p.rotY, 0, 1, 0);
                this.scene.rotate(p.rotX, 1, 0, 0);
                
                // Shrink as they approach end of life
                const currentScale = p.scale * (1.0 - (p.life / p.maxLife));
                this.scene.scale(currentScale, currentScale, currentScale);
                
                this.dustCube.display();
                this.scene.popMatrix();
            }
            
            // Restore default appearance to not break other rendering
            if (this.scene.setDefaultAppearance) {
                this.scene.setDefaultAppearance();
            }
        }
    }
}

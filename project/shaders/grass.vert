attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform float uTime;
uniform float uWindAmp;
uniform float uWindFreq;

varying vec2 vTextureCoord;
varying float vTipness;

void main() {
    vTextureCoord = aTextureCoord;

    // Tip = top of texture (v = 0). Root = bottom (v = 1).
    // Sway only the tip. Anchor the root.
    float tipness = 1.0 - aTextureCoord.y;
    vTipness = tipness;

    // Per-clump phase from world-space x,z so neighbouring blades aren't in lockstep.
    float phase = aVertexPosition.x * 0.13 + aVertexPosition.z * 0.27;

    vec3 displaced = aVertexPosition;
    displaced.x += sin(uTime * uWindFreq + phase) * uWindAmp * tipness;
    displaced.z += cos(uTime * uWindFreq * 0.7 + phase * 1.3) * uWindAmp * 0.5 * tipness;

    gl_Position = uPMatrix * uMVMatrix * vec4(displaced, 1.0);
}

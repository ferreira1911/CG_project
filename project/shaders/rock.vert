#ifdef GL_ES
precision highp float;
#endif

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform sampler2D uNoiseMap;   // Unit 2 — greyscale noise texture
uniform float uDeformScale;
uniform float uSeed;

varying vec2 vTextureCoord;
varying vec3 vNormal;

// Triplanar noise: sample the 2D noise map on three axis-aligned planes
// and blend by the normal. Avoids sphere-UV poles and gives 3D-looking noise
// from a simple 2D texture.
float sampleNoise(vec3 p, vec3 n) {
    float nX = texture2D(uNoiseMap, p.yz).r;
    float nY = texture2D(uNoiseMap, p.xz).r;
    float nZ = texture2D(uNoiseMap, p.xy).r;
    vec3 w = abs(n);
    w /= (w.x + w.y + w.z);
    return nX * w.x + nY * w.y + nZ * w.z;
}

void main() {
    vTextureCoord = aTextureCoord;
    vNormal = aVertexNormal;

    // Per-rock skew + seed offset so every rock has a unique shape
    vec3 skew = vec3(
        1.0 + 0.5 * sin(uSeed * 1.7),
        1.0 + 0.5 * sin(uSeed * 2.3),
        1.0 + 0.5 * sin(uSeed * 3.1)
    );
    vec3 p = aVertexPosition * skew * 1.5 + vec3(uSeed * 0.37);

    // Low-freq noise pushes outward (bulky rock), high-freq signed noise carves
    // inward dents and outward bumps — rocks get cracks/erosion, not just inflation
    float big    = sampleNoise(p, aVertexNormal);
    float detail = sampleNoise(p * 3.0, aVertexNormal) - 0.5;
    float bump   = big + 0.5 * detail;

    vec3 displacedPosition = aVertexPosition + aVertexNormal * bump * uDeformScale;

    gl_Position = uPMatrix * uMVMatrix * vec4(displacedPosition, 1.0);
}

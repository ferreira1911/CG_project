#ifdef GL_ES
precision mediump float;
#endif

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform sampler2D uNoiseMap;   // Unit 2 — greyscale noise texture
uniform float uDeformScale;
uniform float uSeed;
uniform float uBigFreq;
uniform float uDetailFreq;
uniform float uDetailWeight;
uniform float uTopBias;
uniform vec3  uLightPos;    // Sun direction for vLightDir

varying vec2 vTextureCoord;
varying vec3 vNormal;

// Triplanar noise: 3 texture reads, blended by the absolute normal.
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
    vNormal = normalize(vec3(uNMatrix * vec4(aVertexNormal, 0.0)));

    // Cheap per-rock skew using fract instead of sin
    vec3 h = fract(vec3(uSeed * 0.171, uSeed * 0.232, uSeed * 0.313) + 0.5);
    vec3 skew = 1.0 + h * 0.5;
    vec3 p = aVertexPosition * skew * 1.5 + vec3(uSeed * 0.37);

    // Single triplanar sample blended between low and high frequency.
    // Saves 3 texture reads vs calling sampleNoise twice.
    float big    = sampleNoise(p * uBigFreq, aVertexNormal);
    float detail = sampleNoise(p * uDetailFreq, aVertexNormal) - 0.5;
    float bump   = big + uDetailWeight * detail;

    float topness = aVertexPosition.y * 2.0;
    bump *= 1.0 + uTopBias * topness;

    vec3 displacedPosition = aVertexPosition + aVertexNormal * bump * uDeformScale;
    gl_Position = uPMatrix * uMVMatrix * vec4(displacedPosition, 1.0);
}

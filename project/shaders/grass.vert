attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute float aLocalY;
attribute vec4 aGrassInfo;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;
uniform float uTime;
uniform float uWindAmp;
uniform float uWindFreq;

varying float vLocalY;
varying vec4 vGrassInfo;
varying vec3 vNormal;

void main() {
    vLocalY = aLocalY;
    vGrassInfo = aGrassInfo;
    vNormal = normalize((uNMatrix * vec4(aVertexNormal, 0.0)).xyz);

    float phase = aGrassInfo.y;
    float stiffness = aGrassInfo.z;
    
    float windFactor = pow(aLocalY, 1.5) * 0.4;
    
    float swayX = sin(uTime * uWindFreq * stiffness + phase + aVertexPosition.x * 0.1) * uWindAmp * windFactor;
    float swayZ = cos(uTime * uWindFreq * stiffness * 0.8 + phase + aVertexPosition.z * 0.1) * uWindAmp * windFactor;

    vec3 pos = aVertexPosition;
    pos.x += swayX;
    pos.z += swayZ;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}

#ifdef GL_ES
precision highp float;
#endif

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float uTime;

void main() {
    // 1. Bobbing logic (Up and Down)
    float bob = sin(uTime * 4.0) * 0.4;

    // 2. Squash and Stretch logic (Scale)
    // Scale fluctuates between 0.9 and 1.1 in sync with the bob
    float scaleY = 1.0 + 0.15 * cos(uTime * 4.0);
    float scaleXZ = 1.0 - 0.05 * cos(uTime * 4.0);

    // 3. Rotation logic (Spinning around Y axis)
    float angle = uTime * 3.0;
    mat3 rotY = mat3(
        cos(angle), 0.0, sin(angle),
        0.0, 1.0, 0.0,
        -sin(angle), 0.0, cos(angle)
    );

    vec3 pos = aVertexPosition;
    
    // Apply scale
    pos.x *= scaleXZ;
    pos.z *= scaleXZ;
    pos.y *= scaleY;

    // Apply rotation
    pos = rotY * pos;

    // Apply vertical bobbing
    pos.y += bob; // Base height is now set accurately in MyScene.js

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}

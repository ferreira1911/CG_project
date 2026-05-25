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
    // Bob, squash/stretch, and spin — all driven off uTime so the arrow
    // constantly draws the eye toward the haybale it's anchored above.
    float bob     = sin(uTime * 4.0) * 0.4;
    float scaleY  = 1.0 + 0.15 * cos(uTime * 4.0);
    float scaleXZ = 1.0 - 0.05 * cos(uTime * 4.0);

    float angle = uTime * 3.0;
    mat3 rotY = mat3(
         cos(angle), 0.0, sin(angle),
         0.0,        1.0, 0.0,
        -sin(angle), 0.0, cos(angle)
    );

    vec3 pos = aVertexPosition;
    pos.x *= scaleXZ;
    pos.z *= scaleXZ;
    pos.y *= scaleY;
    pos = rotY * pos;
    pos.y += bob;

    gl_Position = uPMatrix * uMVMatrix * vec4(pos, 1.0);
}

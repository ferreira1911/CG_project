#ifdef GL_ES
precision highp float;
#endif

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float time;

varying vec2 vTextureCoord;
varying vec3 vNormal;

const float PI         = 3.14159265;
const float AMP        = 0.08;
const float FREQ_X     = 1.5;
const float FREQ_THETA = 2.0;
const float SPEED      = 1.5;

void main() {
    // The cover mesh stores theta in s (i/ARCH_SLICES) and length-frac in t.
    float theta      = aTextureCoord.s * PI;
    float lengthFrac = aTextureCoord.t;

    // sin(theta) is 0 at both bottom edges and 1 at the apex — anchors the
    // canvas to the rails so it doesn't peel off the bed.
    float anchor = sin(theta);
    float wave   = sin(FREQ_X * lengthFrac * 2.0 * PI + FREQ_THETA * theta - SPEED * time);
    float disp   = AMP * wave * anchor;

    vec3 displaced = aVertexPosition + aVertexNormal * disp;

    vTextureCoord = aTextureCoord;
    vNormal       = aVertexNormal;
    gl_Position   = uPMatrix * uMVMatrix * vec4(displaced, 1.0);
}

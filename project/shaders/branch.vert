#ifdef GL_ES
precision highp float;
#endif

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float uLength;
uniform float uThickness;

varying vec2 vTextureCoord;
varying vec3 vNormal;

void main() {
    vTextureCoord = vec2(aTextureCoord.s, aTextureCoord.t * uLength * 2.0);
    vNormal = aVertexNormal;
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}

attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;
varying vec3 vObjPos;

void main() {
    vTextureCoord = aTextureCoord;
    vObjPos = aVertexPosition;
    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform float normScale;
uniform float timeFactor;

varying vec4 vert;

void main() {
	// X translation amplitude is controlled by the UI scale slider.
	float xOffset = 0.1 * normScale * sin(timeFactor);
	vec3 displacedPosition = aVertexPosition + vec3(xOffset, 0.0, 0.0);
	gl_Position = uPMatrix * uMVMatrix * vec4(displacedPosition, 1.0);

	vert = gl_Position;
}


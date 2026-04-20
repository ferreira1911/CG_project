attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;
uniform float timeFactor;
uniform sampler2D waterMap;
varying vec2 vTextureCoord;

void main() {
	// Lower speed for a smoother water movement.
	const float mapScrollSpeed = 0.010;
	const float waveAmplitude = 0.1;

	vTextureCoord = aTextureCoord;
	vec2 mapOffset = vec2(mapScrollSpeed * timeFactor, mapScrollSpeed * timeFactor);
	float height = texture2D(waterMap, vTextureCoord + mapOffset).b;
	vec3 offset = aVertexNormal * waveAmplitude * height; 
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition + offset, 1.0);
}
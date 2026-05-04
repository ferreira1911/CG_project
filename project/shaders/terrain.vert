attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uNMatrix;

uniform sampler2D uSampler;
uniform sampler2D uSampler2;
uniform sampler2D uSampler4;
uniform sampler2D uSampler5;

varying vec2 vTextureCoord;

void main() {
    vTextureCoord = aTextureCoord;

    // Displace vertices in Y using the heightmap red channel.
    vec4 heightMapColor = texture2D(uSampler2, aTextureCoord);
    float offset = heightMapColor.r * 20.0;
    float maskVal = texture2D(uSampler4, aTextureCoord).r;
    float fineDisp = texture2D(uSampler5, aTextureCoord * 50.0).r;
    offset += (fineDisp * 0.8 * (1.0 - maskVal));
    vec3 newPosition = aVertexPosition + vec3(0.0, offset, 0.0);
    gl_Position = uPMatrix * uMVMatrix * vec4(newPosition, 1.0);
}
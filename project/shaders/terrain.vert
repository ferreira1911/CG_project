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
uniform vec2 uHeightTexel;
uniform float uTerrainHeight;

varying vec2 vTextureCoord;
varying vec3 vNormal;
varying vec2 vWorldXZ;

float sampleHeight(vec2 uv) {
    vec2 clampedUV = clamp(uv, vec2(0.0), vec2(1.0));
    return texture2D(uSampler2, clampedUV).r * uTerrainHeight;
}

void main() {
    vTextureCoord = aTextureCoord;
    vWorldXZ = aVertexPosition.xz * 300.0;

    // Displace vertices in Y using the heightmap red channel.
    vec4 heightMapColor = texture2D(uSampler2, aTextureCoord);
    float offset = heightMapColor.r * uTerrainHeight;
    float maskVal = texture2D(uSampler4, aTextureCoord).r;
    float fineDisp = texture2D(uSampler5, aTextureCoord * 30.0).r;
    offset += (fineDisp * 0.8 * (1.0 - maskVal));
    vec3 newPosition = aVertexPosition + vec3(0.0, offset, 0.0);

    // Approximate the terrain normal from the sampled heightmap so hills and
    // valleys catch the sun with real contrast instead of a flat up-vector.
    float hL = sampleHeight(aTextureCoord - vec2(uHeightTexel.x, 0.0));
    float hR = sampleHeight(aTextureCoord + vec2(uHeightTexel.x, 0.0));
    float hD = sampleHeight(aTextureCoord - vec2(0.0, uHeightTexel.y));
    float hU = sampleHeight(aTextureCoord + vec2(0.0, uHeightTexel.y));

    vec3 tangentX = vec3(2.0 * uHeightTexel.x, hR - hL, 0.0);
    vec3 tangentZ = vec3(0.0, hU - hD, 2.0 * uHeightTexel.y);
    vec3 terrainNormal = normalize(cross(tangentZ, tangentX));
    vNormal = normalize(vec3(uNMatrix * vec4(terrainNormal, 0.0)));
    
    gl_Position = uPMatrix * uMVMatrix * vec4(newPosition, 1.0);
}
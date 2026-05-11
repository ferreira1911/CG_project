#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;

uniform sampler2D uColorMap;
uniform sampler2D uNormalMap;
uniform vec3 uLightPos;

void main() {
    vec4 texColor = texture2D(uColorMap, vTextureCoord);

    vec3 normalData    = texture2D(uNormalMap, vTextureCoord).rgb;
    vec3 unpackedNormal = normalData * 2.0 - 1.0;
    vec3 finalNormal   = normalize(vNormal + unpackedNormal);

    float diffuseLight = max(dot(finalNormal, normalize(uLightPos)), 0.0);
    diffuseLight = 0.16 + 0.84 * diffuseLight;
    gl_FragColor = vec4(texColor.rgb * diffuseLight, 1.0);
}

#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;

uniform sampler2D uColorMap;   // Unit 0
uniform sampler2D uNormalMap;  // Unit 1
uniform vec3 uLightPos;

void main() {
    vec4 texColor = texture2D(uColorMap, vTextureCoord);

    vec3 normalData = texture2D(uNormalMap, vTextureCoord).rgb;
    vec3 unpackedNormal = normalData * 2.0 - 1.0;

    vec3 finalNormal = normalize(vNormal + unpackedNormal);

    vec3 lightDir = normalize(uLightPos);
    float diffuseLight = max(dot(finalNormal, lightDir), 0.35);

    gl_FragColor = vec4(texColor.rgb * diffuseLight, 1.0);
}

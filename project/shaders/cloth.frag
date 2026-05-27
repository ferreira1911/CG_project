#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
varying vec3 vNormal;

uniform sampler2D uSampler;
uniform vec3 uLightPos;

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);

    vec3 normal   = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos);
    float lambert  = max(dot(normal, lightDir), 0.0);
    float lighting = 0.28 + 0.72 * lambert;

    gl_FragColor = vec4(texColor.rgb * lighting, texColor.a);
}

#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D waterMap;
uniform float timeFactor;

void main() {
    // Slower UV motion to avoid overly fast water animation.
    vec2 texOffset = vec2(timeFactor * 0.002, timeFactor * 0.002);
    vec2 mapOffset = vec2(timeFactor * 0.015, timeFactor * 0.015);

    vec4 baseColor = texture2D(uSampler, vTextureCoord + texOffset);
    float height = texture2D(waterMap, vTextureCoord + mapOffset).b;

    // Lower height values receive more shadow.
    float shadowFactor = mix(0.5, 1.0, height);
    gl_FragColor = vec4(baseColor.rgb * shadowFactor, baseColor.a);
}
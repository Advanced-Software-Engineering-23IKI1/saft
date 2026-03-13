#version 300 es
precision highp float;

uniform sampler2D uSpectrogram;  // spectrogram texture
uniform float width_offset;
uniform float height_offset;
uniform float zoom;
uniform float minDB;
uniform float maxDB;
uniform float maxBin;
uniform float minBin;

in vec2 v_uv;
out vec4 outColor;

void main() {
    float step = 1.0 / zoom;
    float tFloat = width_offset + v_uv.x * step;
    float yFloat = height_offset + v_uv.y * step;
    float binFloat = maxBin - yFloat;

    vec2 texCoord = vec2(
    clamp((width_offset + v_uv.x * step) / 1.0, 0.0, 1.0),             // scale if needed
    clamp(1.0 - ((height_offset + v_uv.y * step) / (maxBin - minBin)), 0.0, 1.0)
);
    float val = texture(uSpectrogram, texCoord).r;  // no delta

    val = max(val, 1e-12);
    float db = 20.0 * log(val) / log(10.0);
    float norm = (db - minDB) / (maxDB - minDB);
    float c = clamp(norm, 0.0, 1.0);

    vec3 color = vec3(c); // black → white
    outColor = vec4(color, 1.0);
}
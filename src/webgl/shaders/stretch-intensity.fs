#version 300 es

precision mediump float;

in vec2 v_texture_position;

uniform sampler2D u_intensities;
uniform float u_min_intensity;
uniform float u_max_intensity;

out vec4 outColor;

void main() {
   float intensity = texture(u_intensities, v_texture_position).r;
   intensity = (intensity - u_min_intensity) / (u_max_intensity - u_min_intensity);

   outColor = vec4(intensity);
}

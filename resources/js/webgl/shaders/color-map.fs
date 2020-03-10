#version 300 es

precision mediump float;

in vec2 v_texture_position;

uniform sampler2D u_input;
uniform sampler2D u_color_map;

out vec4 outColor;

void main() {
   float intensity = texture(u_input, v_texture_position).r;
   outColor = texture(u_color_map, vec2(intensity, 0.5));
   // Multiply with alpha because the texture is not stored as premultiplied alpha.
   // Only relevant if the color map includes alpha values other than 1.
   outColor.rgb *= outColor.a;
}

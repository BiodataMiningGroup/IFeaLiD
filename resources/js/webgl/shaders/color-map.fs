#version 300 es

precision mediump float;

in vec2 v_texture_position;

uniform sampler2D u_input;
uniform sampler2D u_color_map;
uniform float u_alpha_scaling;

out vec4 outColor;

void main() {
   float intensity = texture(u_input, v_texture_position).r;
   outColor = texture(u_color_map, vec2(intensity, 0.5));

   float alpha = min(1.0, intensity + u_alpha_scaling);
   outColor.a = alpha;
   // Multiply with alpha because the texture is not stored as premultiplied alpha.
   outColor.rgb *= alpha;
}

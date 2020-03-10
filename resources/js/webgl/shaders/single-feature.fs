#version 300 es

precision mediump float;
precision mediump int;
precision mediump usampler2D;

in vec2 v_texture_position;

// index of the tile to which the feature belongs
uniform float u_tile;
// filters out every feature but the desired one
uniform vec4 u_channel_mask;

out vec4 outColor;

const vec4 ONES = vec4(1);

<%=TEXTURE_3D=%>

void main() {
    // y-flip the texture position because the textures are stored y-flipped.
    vec4 colors = texture3D(vec2(v_texture_position.x, 1.0 - v_texture_position.y), u_tile);
    float channel_color = dot(colors * u_channel_mask, ONES);

    outColor = vec4(channel_color);
}

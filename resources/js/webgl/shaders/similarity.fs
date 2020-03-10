#version 300 es

precision mediump float;
precision mediump int;
precision mediump usampler2D;

in vec2 v_texture_position;

uniform vec2 u_mouse_position;
uniform float u_normalization;

out vec4 outColor;

const vec4 ONES = vec4(1);
const vec4 ZEROS = vec4(0);

<%=SAMPLER_DEFINITION=%>
<%=CONVERT_UVEC=%>

void main() {
    // angle between the two vectors
    // <A,B> = ||A|| * ||B|| * cos(angle)
    // => angle = acos(<A,B>/(||A||*||B||))
    float angle = 0.0;

    // cummulating the squared length of this pixels vector
    float currentLength = 0.0;
    // cummulating the squared length of the reference pixels vector
    float referenceLength = 0.0;

    // temporary texture values of current position
    vec4 current;
    // temporary texture values of reference position
    vec4 reference;

    // the index of the current tile
    float tile;

    // the row-major index of the current tile on it's texture
    float index_on_referencer;
    // the column in which the current tile lies on the texture
    float column;
    // the row in which the current tile lies on the texture
    float row;
    // the index of the texture, the current tile is on
    float sampler_index;

    // the 2d coordinates of the current position on the correct texture
    vec2 coords_2d_current;
    // the 2d coordinates of the reference position on the correct texture
    vec2 coords_2d_reference;

    for (int i = 0; i < <%=TILES=%>; i++) {
        tile = float(i);

        index_on_referencer = mod(tile, <%=TILES_PER_TEXTURE=%>);
        column = mod(index_on_referencer, <%=TILE_COLUMNS=%>);
        row = floor(index_on_referencer / <%=TILE_COLUMNS=%>);

        coords_2d_reference = vec2(
            <%=TILE_WIDTH=%> * (column + u_mouse_position.x),
            <%=TILE_HEIGHT=%> * (row + u_mouse_position.y)
        );

        coords_2d_current = vec2(
            <%=TILE_WIDTH=%> * (column + v_texture_position.x),
            // y-flip the texture position because the textures are stored y-flipped.
            <%=TILE_HEIGHT=%> * (row + 1.0 - v_texture_position.y)
        );

        // needed for DYNAMIC_SAMPLER_QUERIES
        sampler_index = floor(tile / <%=TILES_PER_TEXTURE=%>);

        // get rgba of the pixel to compare
        // get rgba of the position of this pixel
        <%=DYNAMIC_SAMPLER_QUERIES
            reference = convertUvec(texture(<%=SAMPLER=%>, coords_2d_reference));
            current = convertUvec(texture(<%=SAMPLER=%>, coords_2d_current));
        =%>

        currentLength += dot(current, current);
        referenceLength += dot(reference, reference);
        angle += dot(current, reference);
    }

    // if the intensities of this fragment are all 0, don't draw it
    if (currentLength == 0.0) {
        outColor = ZEROS;
        return;
    }

    angle *= inversesqrt(currentLength * referenceLength);

    // Normalize and clip angle to [0, 1].
    angle = acos(angle) * u_normalization;
    angle = min(1.0, max(0.0, angle));

    // Invert angle because a lower angle should signify a higher similarity.
    angle = 1.0 - angle;

    outColor = vec4(angle);
}

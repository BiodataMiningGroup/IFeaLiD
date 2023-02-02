import Program from './Program';
import fragmentShaderSource from '../shaders/color-map.fs';
import vertexShaderSource from '../shaders/rectangle.vs';
import {FIRE} from './colorMaps';

export default class ColorMap extends Program {
    constructor() {
        super(vertexShaderSource, fragmentShaderSource);
        this.colorMapTexture = null;
        this.inputTexture = null;
        this.alphaScaling = 1.0;
        this.alphaScalingPointer = null;
    }

    initialize(gl, handler) {
        let pointer = this.getPointer();
        handler.useVertexPositions(this);
        handler.useTexturePositions(this);

        this.alphaScalingPointer = gl.getUniformLocation(pointer, 'u_alpha_scaling');

        this.colorMapTexture = handler.getTexture('colorMap');
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, FIRE);
        gl.uniform1i(gl.getUniformLocation(pointer, 'u_color_map'), 1);
    }

    beforeRender(gl, handler) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.colorMapTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.uniform1f(this.alphaScalingPointer, this.alphaScaling);
    }

    afterRender(gl, handler) {
        //
    }

    link(program) {
        this.inputTexture = program.getOutputTexture();
    }

    setAlphaScaling(alphaScaling) {
        this.alphaScaling = alphaScaling;
    }
}

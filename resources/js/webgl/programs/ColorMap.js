import Program from './Program';
import fragmentShaderSource from 'raw-loader!../shaders/color-map.fs';
import vertexShaderSource from 'raw-loader!../shaders/rectangle.vs';
import {FIRE, FIRE_ALPHA} from './colorMaps';

export default class ColorMap extends Program {
    constructor(options) {
        super(vertexShaderSource, fragmentShaderSource);
        this.colorMapTexture = null;
        this.inputTexture = null;
        this.useAlpha = options.useAlpha === undefined ? false : options.useAlpha;
    }

    initialize(gl, handler) {
        let pointer = this.getPointer();
        handler.useVertexPositions(this);
        handler.useTexturePositions(this);

        this.colorMapTexture = handler.getTexture('colorMap');
        if (this.useAlpha) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, FIRE_ALPHA);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, FIRE);
        }
        gl.uniform1i(gl.getUniformLocation(pointer, 'u_color_map'), 1);
    }

    beforeRender(gl, handler) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.colorMapTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    afterRender(gl, handler) {
        //
    }

    link(program) {
        this.inputTexture = program.getOutputTexture();
    }
}

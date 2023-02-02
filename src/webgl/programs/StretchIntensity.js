import Program from './Program';
import fragmentShaderSource from '../shaders/stretch-intensity.fs';
import vertexShaderSource from '../shaders/rectangle.vs';
import {FIRE} from './colorMaps';


export default class StretchIntensity extends Program {
    constructor(options) {
        super(vertexShaderSource, fragmentShaderSource);
        this.width = options.width;
        this.height = options.height;
        this.outputTexture = null;
        this.inputTexture = null;
        this.intensityStats = null;
        this.minIntensityPointer = null;
        this.maxIntensityPointer = null;
    }

    initialize(gl, handler) {
        let pointer = this.getPointer();
        handler.useVertexPositions(this);
        handler.useTexturePositions(this);

        this.framebuffer = handler.getFramebuffer('stretchIntensity');
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        this.outputTexture = handler.getTexture('stretchIntensity');
        gl.bindTexture(gl.TEXTURE_2D, this.outputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, this.width, this.height, 0, gl.RED, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.outputTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        this.minIntensityPointer = gl.getUniformLocation(pointer, 'u_min_intensity');
        this.maxIntensityPointer = gl.getUniformLocation(pointer, 'u_max_intensity');
    }

    beforeRender(gl, handler) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.inputTexture);

        gl.uniform1f(this.minIntensityPointer, this.intensityStats.min);
        gl.uniform1f(this.maxIntensityPointer, this.intensityStats.max);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    }

    afterRender(gl, handler) {
        //
    }

    link(program) {
        this.intensityStats = program.getIntensityStats();
        this.inputTexture = program.getOutputTexture();
    }

    getOutputTexture() {
        return this.outputTexture;
    }
}

import IntensityProgram from './IntensityProgram';
import fragmentShaderSource from '../shaders/single-feature.fs';
import vertexShaderSource from '../shaders/rectangle.vs';

export default class SingleFeature extends IntensityProgram {
    constructor(options) {
        super(vertexShaderSource, fragmentShaderSource, options);
        this.tilePointer = null;
        this.channelMaskPointer = null;
        this.featureTile = 0;
        this.channelMask = [0, 0, 0, 0];
    }

    initialize(gl, handler) {
        super.initialize(gl, handler);
        let pointer = this.getPointer();
        this.tilePointer = gl.getUniformLocation(pointer, 'u_tile');
        this.channelMaskPointer = gl.getUniformLocation(pointer, 'u_channel_mask');
    }

    beforeRender(gl, handler) {
        super.beforeRender(gl, handler);
        gl.uniform1f(this.tilePointer, this.featureTile);
        gl.uniform4f(this.channelMaskPointer, ...this.channelMask);
    }

    afterRender(gl, handler) {
        super.afterRender(gl, handler);
    }

    setFeatureIndex(index) {
        this.featureTile = Math.floor(index / 4);
        this.channelMask.fill(0);
        this.channelMask[index % 4] = 1;
    }
}

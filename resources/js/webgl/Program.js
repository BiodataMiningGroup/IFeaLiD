export default class Program {
    constructor(id) {
        this.id = `${id}`;
        this.vertexShaderSourceUrl = '';
        this.fragmentShaderSourceUrl = '';
        this.pointer = null;
    }

    fetchSource_(url) {
        //
    }

    initialize(gl, handler, pointer) {
        this.pointer = pointer;
    }

    beforeRender(gl, handler) {
        //
    }

    afterRender(gl, handler) {
        //
    }

    getPointer() {
        return this.pointer;
    }


    getVertexShaderSource() {
        return this.fetchSource_(this.vertexShaderSourceUrl);
    }

    getFragmentShaderSource() {
        return this.fetchSource_(this.fragmentShaderSourceUrl);
    }
}

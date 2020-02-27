export default class Program {
    constructor(id) {
        this.id = `${id}`;
        this.pointer = null;
    }

    initialize(gl, handler) {
        //
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

    setPointer(pointer) {
        this.pointer = pointer;
    }

    getVertexShaderSource() {
        return '';
    }

    getFragmentShaderSource() {
        return '';
    }
}

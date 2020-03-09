let mount = function (id, vm) {
    window.addEventListener('load', function () {
        let element = document.getElementById(id);
        if (element) {
            vm.$mount(element);
        }
    });
};

class ImageHandler {
    constructor(dataset) {
        this.dataset = dataset;
        this.gl = this.initializeGl();
    }

    initializeGl() {
        let canvas = document.createElement('canvas');
        let gl = canvas.getContext("webgl2");
        if (!gl) {
            throw 'Your browser does not support WebGL 2.';
        }

        gl.activeTexture(gl.TEXTURE0);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, gl.createFramebuffer());
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        return gl;
    }

    fetchImage(index) {
        let image = new Image();
        let promise = new Promise((resolve, reject) => {
            image.addEventListener('load', function () {
                resolve(image);
            });
            image.addEventListener('error', reject);
        });
        image.src = `${this.dataset.url}/${index}.png`;

        return promise;
    }

    decodeImage_(gl, image) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        let data = new Uint8Array(image.width * image.height * 4);
        gl.readPixels(0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

        return data;
    }

    decodeImage(image) {
        return this.decodeImage_(this.gl, image);
    }
}

export {mount, ImageHandler};

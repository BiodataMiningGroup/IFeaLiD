import {PNG} from 'pngjs/browser';

let canvas;
let gl;

let mount = function (id, vm) {
    window.addEventListener('load', function () {
        let element = document.getElementById(id);
        if (element) {
            vm.$mount(element);
        }
    });
};

let fetchAndDecodePng = function (url) {
    if (!canvas) {
        canvas = document.createElement('canvas');
        gl = canvas.getContext("webgl2");
        gl.activeTexture(gl.TEXTURE0);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    }

    if (gl) {
        let img = new Image();
        let promise = new Promise(function (resolve, reject) {
            img.addEventListener('load', function () {
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
                gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
                let data = new Uint8Array(this.width * this.height * 4);
                gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
                resolve(data);
            });

            img.addEventListener('error', function () {
                reject(`Failed to load image ${img.src}.`);
            });
        });
        img.src = url;

        return promise;
    } else {
        return Vue.http.get(url, {responseType: 'arraybuffer'})
            .then(function (response) {
                return new Promise(function (resolve, reject) {
                    new PNG().parse(response.body, function(error, png) {
                        if (error) {
                            return reject(error);
                        }

                        return resolve(png.data);
                    });
                });
            });
    }
};


export {mount, fetchAndDecodePng};

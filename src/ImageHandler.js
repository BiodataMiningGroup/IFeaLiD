import {BlobWriter} from "@zip.js/zip.js";

export default class ImageHandler {
    constructor(dataset) {
        this.dataset = dataset;
        this.gl = this.initializeGl_();
    }

    initializeGl_() {
        let canvas = document.createElement('canvas');
        let gl = canvas.getContext("webgl2");
        if (!gl) {
            throw 'Your browser does not support WebGL 2.';
        }
        gl.getExtension("EXT_color_buffer_float");

        gl.activeTexture(gl.TEXTURE0);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, gl.createFramebuffer());
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        return gl;
    }

    fetchImage_(index) {
        let image = new Image();
        let promise = new Promise((resolve, reject) => {
            image.addEventListener('load', function () {
                resolve(image);
            });
            image.addEventListener('error', function () {
                reject(new Error(`Failed to load dataset part ${index}.png.`));
            });
        });

        this.dataset.entries[`${index}.png`].getData(new BlobWriter).then(function (data) {
            image.src = URL.createObjectURL(data);
        });

        return promise;
    }

    decodeImage_(image) {
        let gl = this.gl;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        let data = new Uint8Array(image.width * image.height * 4);
        gl.readPixels(0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

        if (this.dataset.precision === 8) {
            return data;
        } else if (this.dataset.precision === 16) {
            return new Uint16Array(data.buffer);
        }

        return new Uint32Array(data.buffer);
    }

    mergeImagesToTile_(images) {
        let merged;

        if (images.length === 4) {

            merged = new Uint32Array(this.dataset.width * this.dataset.height * 4);
            for (let i = 0; i < images[0].length; i++) {
                merged[i * 4] = images[0][i];
                merged[i * 4 + 1] = images[1][i];
                merged[i * 4 + 2] = images[2][i];
                merged[i * 4 + 3] = images[3][i];
            }

        } else if (images.length === 2) {

            merged = new Uint16Array(this.dataset.width * this.dataset.height * 4);
            for (let i = 0; i < images[0].length; i += 2) {
                merged[i * 2] = images[0][i];
                merged[i * 2 + 1] = images[0][i + 1];
                merged[i * 2 + 2] = images[1][i];
                merged[i * 2 + 3] = images[1][i + 1];
            }

        } else {
            merged = images[0];
        }

        return merged;
    }

    load(parallel) {
        let channelsPerImage = 32 / this.dataset.precision;
        let imageCount = Math.ceil(this.dataset.features / channelsPerImage);
        let imagesLoaded = 0;

        let imagesPerTile = this.dataset.precision / 8;
        let tileCount = Math.ceil(this.dataset.features / 4);
        let lastTileIndex = tileCount - 1;
        let latsTileImages = imageCount % imagesPerTile;
        let tilesLoaded = 0;
        let tilesCache = {};
        let tilePromises = [];
        let tileRAR = [];

        for (let i = 0; i < tileCount; i++) {
            tilePromises.push(new Promise(function (resolve, reject) {
                tileRAR.push({resolve, reject});
            }));
        }

        let gatherTile = (index, part, data) => {
            if (!tilesCache[index]) {
                if (index === lastTileIndex) {
                    tilesCache[index] = Array(latsTileImages).fill(undefined);
                } else {
                    tilesCache[index] = Array(imagesPerTile).fill(undefined);
                }
            }

            tilesCache[index][part] = data;
            let complete = tilesCache[index].every(function (item) {
                return item !== undefined;
            });

            if (complete) {
                let tile = this.mergeImagesToTile_(tilesCache[index]);
                tileRAR[index].resolve([tile, index]);
                delete tilesCache[index];
            }
        };

        let fetchNextImage = () => {
            if (imagesLoaded < imageCount) {
                let tileIndex = Math.floor(imagesLoaded / imagesPerTile);
                let tilePartIndex = imagesLoaded % imagesPerTile;

                this.fetchImage_(imagesLoaded)
                    .then(this.decodeImage_.bind(this))
                    .then(gatherTile.bind(this, tileIndex, tilePartIndex))
                    .then(fetchNextImage)
                    .catch(tileRAR[tileIndex].reject);

                imagesLoaded += 1;
            }
        };

        parallel = Math.min(parallel, imageCount);

        while (parallel--) {
            fetchNextImage();
        }

        return tilePromises;
    }
}

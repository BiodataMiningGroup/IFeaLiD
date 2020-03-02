require('./bootstrap');
import {mount} from './utils';
import WebglHandler from './webgl/Handler';
import visualization from './components/visualization';
import loadingIndicator from './components/loadingIndicator';

mount('show-container', new Vue({
    data: {
        dataset: window.DATASET,
        handler: null,
        loaded: 0,
        ready: false,
    },
    components: {
        visualization, visualization,
        loadingIndicator: loadingIndicator,
    },
    methods: {
        fetchImages() {
            let count = Math.ceil(this.dataset.features / 4);
            let promises = [];
            let images = [];

            while (count--) {
                let image = new Image();
                promises.push(new Promise(function (resolve, reject) {
                    image.addEventListener('error', reject);
                    image.addEventListener('load', function () {
                        resolve(image);
                    });
                }))
                images.push(image);
            }

            let loadImage = () => {
                this.loaded = 1 - (images.length / promises.length);
                if (images.length > 0) {
                    let image = images.pop();
                    let index = images.length;
                    image.addEventListener('load', loadImage);
                    image.src = `${this.dataset.url}/${index}.png`;
                }
            };

            // Load images with multiple parallel connections.
            let parallel = 3;
            while (parallel--) {
                loadImage();
            }

            return Promise.all(promises);
        },
        initializeWebgl() {
            let canvas = document.createElement('canvas');
            canvas.width = this.dataset.width;
            canvas.height = this.dataset.height;

            this.handler = new WebglHandler({
                canvas: canvas,
                width: this.dataset.width,
                height: this.dataset.height,
                depth: this.dataset.features,
                // Reserve units for the similarity, stretch intensity and color map textures.
                reservedUnits: 3,
            });

            window.addEventListener('beforeunload', this.handler.destruct.bind(this.handler));
        },
        setReady() {
            this.ready = true;
        },
    },
    created() {
        this.initializeWebgl();
    },
    mounted() {
        this.fetchImages()
            .then(this.handler.storeTiles.bind(this.handler))
            .then(this.setReady);
        },
}));

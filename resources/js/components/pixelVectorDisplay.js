import {FIRE} from '../webgl/programs/colorMaps';

export default {
    template: `
        <div class="intensity-list">
            <canvas ref="canvas"></canvas>
        </div>
    `,
    props: {
        dataset: {
            required: true,
            type: Object,
        },
    },
    components: {
        //
    },
    data () {
        return {
            canvasSize: [0, 0],
            hasReference: false,
            hoveredFeature: null,
        };
    },
    computed: {
        barHeight() {
            return this.canvasSize[1] / this.dataset.features;
        },
    },
    methods: {
        updatePixelVector(pixelVector) {
            this.pixelVector = pixelVector;
            this.draw();
        },
        updateReferencePixelVector(pixelVector) {
            this.referencePixelVector = pixelVector;
            this.hasReference = pixelVector.length > 0;
            this.draw();
        },
        draw() {
            this.canvas.width = this.canvasSize[0];
            this.canvas.height = this.canvasSize[1];

            if (this.hoveredFeature !== null) {
                // Bootstrap $gray-900.
                this.ctx.fillStyle = '#212529';
                this.ctx.fillRect(0, this.barHeight * this.hoveredFeature, this.canvas.width, this.barHeight);
            }

            if (this.hasReference) {
                this.drawWithReference();
            } else {
                this.drawWithoutReference();
            }
        },
        drawWithoutReference() {
            this.ctx.fillStyle = 'white';
            this.fillPath(this.canvas.width, 0, this.canvas.width, this.canvas.height, this.pixelVector, -1)
        },
        drawWithReference() {
            let halfWidth = this.canvas.width / 2;
            this.ctx.fillStyle = 'white';
            this.fillPath(halfWidth, 0, halfWidth, this.canvas.height, this.pixelVector, -1)
            // $primary color.
            this.ctx.fillStyle = '#fc6600';
            this.fillPath(halfWidth, 0, halfWidth, this.canvas.height, this.referencePixelVector, 1)
        },
        fillPath(startX, startY, width, height, vector, factor) {
            let barHeight = this.barHeight;
            let barWidth = 0;
            let ctx = this.ctx;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            for (var i = 0; i < vector.length; i++) {
                barWidth = width * vector[i];
                ctx.lineTo(startX + factor * barWidth, startY + i * barHeight);
                ctx.lineTo(startX + factor * barWidth, startY + (i + 1) * barHeight);
            }
            ctx.lineTo(startX, startY + height);
            ctx.fill();
        },
        updateCanvasSize() {
            this.canvasSize = [this.$el.clientWidth, this.$el.clientHeight];
        },
        updateHoveredFeature(event) {
            let rect = event.target.getBoundingClientRect();
            this.hoveredFeature = Math.floor(this.dataset.features * (event.clientY - rect.top) / event.target.height);
        },
        resetHoveredFeature() {
            this.hoveredFeature = null;
        },
    },
    watch: {
        canvasSize() {
            this.draw();
        },
        hoveredFeature(feature) {
            this.draw();
            this.$emit('hover', feature);
        },
    },
    created() {
        this.pixelVector = new Uint8Array([]);
        this.referencePixelVector = new Uint8Array([]);
    },
    mounted() {
        this.canvas = this.$refs.canvas;
        this.ctx = this.canvas.getContext('2d');
        window.addEventListener('resize', () => {
            this.$nextTick(this.updateCanvasSize)
        });
        this.$nextTick(this.updateCanvasSize);
        this.canvas.addEventListener('pointermove', this.updateHoveredFeature);
        this.canvas.addEventListener('pointerleave', this.resetHoveredFeature);
    },
};

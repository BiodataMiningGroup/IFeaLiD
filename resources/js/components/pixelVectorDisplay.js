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
            hoverIndex: 0,
            canvasSize: [0, 0],
            hasReference: false,
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
            if (this.hasReference) {
                this.drawWithReference();
            } else {
                this.drawWithoutReference();
            }
        },
        drawWithoutReference() {
            let width = this.canvasSize[0];
            let height = this.canvasSize[1];
            this.canvas.width = width;
            this.canvas.height = height;

            this.ctx.fillStyle = 'white';
            this.fillPath(width, 0, width, height, this.pixelVector, -1)
        },
        drawWithReference() {
            let width = this.canvasSize[0];
            let height = this.canvasSize[1];
            let halfWidth = width / 2;
            this.canvas.width = width;
            this.canvas.height = height;

            this.ctx.fillStyle = 'white';
            this.fillPath(halfWidth, 0, halfWidth, height, this.pixelVector, -1)
            this.ctx.fillStyle = '#fc6600';
            this.fillPath(halfWidth, 0, halfWidth, height, this.referencePixelVector, 1)
        },
        fillPath(startX, startY, width, height, vector, factor) {
            let barHeight = this.barHeight;
            let barWidth = 0;
            let ctx = this.ctx;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            for (let i = 0; i < vector.length; i++) {
                barWidth = width * vector[i] / 255;
                ctx.lineTo(startX + factor * barWidth, startY + i * barHeight);
                ctx.lineTo(startX + factor * barWidth, startY + (i + 1) * barHeight);
            }
            ctx.lineTo(startX, startY + height);
            ctx.fill();
        },
        updateCanvasSize() {
            this.canvasSize = [this.$el.clientWidth, this.$el.clientHeight];
        },
    },
    watch: {
        canvasSize() {
            this.draw();
        },
    },
    created() {
        this.pixelVector = new Uint8Array([]);
        this.referencePixelVector = new Uint8Array([]);
    },
    mounted() {
        this.canvas = this.$refs.canvas;
        this.ctx = this.canvas.getContext('2d');
        // this.canvas.addEventListener('pointermove', this.updateHoverIndex.bind(this));
        window.addEventListener('resize', () => {
            this.$nextTick(this.updateCanvasSize)
        });
        this.$nextTick(this.updateCanvasSize);
    },
};

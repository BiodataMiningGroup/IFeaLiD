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
            this.drawCanvas();
        },
        drawCanvas() {
            let ctx = this.ctx;
            let width = this.canvasSize[0];
            let height = this.canvasSize[1];
            let vector = this.pixelVector;
            let barHeight = this.barHeight;
            let barWidth = 0;

            this.canvas.width = width;
            this.canvas.height = height;
            ctx.fillStyle = '#ccc';
            ctx.beginPath();
            ctx.moveTo(width, 0);
            for (let i = 0; i < height; i++) {
                barWidth = width * vector[i] / 255;
                ctx.lineTo(width - barWidth, i * barHeight);
                ctx.lineTo(width - barWidth, (i + 1) * barHeight);
            }
            ctx.lineTo(width, height);
            ctx.fill();
        },
        updateCanvasSize() {
            this.canvasSize = [this.$el.clientWidth, this.$el.clientHeight];
        },
    },
    watch: {
        canvasSize() {
            this.drawCanvas();
        },
    },
    created() {
        this.pixelVector = new Uint8Array([]);
    },
    mounted() {
        this.canvas = this.$refs.canvas;
        this.ctx = this.canvas.getContext('2d');
        // this.canvas.addEventListener('pointermove', this.updateHoverIndex.bind(this));
        // window.addEventListener('resize', () => {
        //     this.$nextTick(this.updateCanvasSize)
        // });
        this.$nextTick(this.updateCanvasSize);
    },
};

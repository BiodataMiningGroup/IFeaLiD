<template>
<svg class="loading-indicator" :height="size" :width="size">
    <text text-anchor="middle" dominant-baseline="middle" :x="centerX" :y="centerY" v-text="progressText"></text>
    <path :d="draw" />
</svg>
</template>

<script>
export default {
    props: {
        size: {
            required: true,
            type: Number,
        },
        progress: {
            default: 0,
            type: Number,
        },
        stroke: {
            default: 6,
            type: Number,
        },
    },
    computed: {
        centerX() {
            return this.size / 2;
        },
        centerY() {
            return this.size / 2;
        },
        draw() {
            let radius = (this.size - this.stroke) / 2;
            // Don't use 360 degrees because the arc vanishes in this case.
            let endAngle = 359.99 * this.progress;

            return this.describeArc(this.centerX, this.centerY, radius, 0, endAngle);
        },
        progressText() {
            return `${Math.round(this.progress * 100)} %`;
        },
    },
    methods: {
        polarToCartesian(centerX, centerY, radius, angleInDegrees) {
            let angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

            return {
                x: centerX + (radius * Math.cos(angleInRadians)),
                y: centerY + (radius * Math.sin(angleInRadians)),
            };
        },
        describeArc(x, y, radius, startAngle, endAngle) {
            let start = this.polarToCartesian(x, y, radius, endAngle);
            let end = this.polarToCartesian(x, y, radius, startAngle);

            let largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";


            let d = [
                "M", start.x, start.y,
                "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            ].join(" ");

            return d;
        },
    },
};
</script>

<style lang="scss" scoped>
.loading-indicator {
    width: 120px;
    height: 120px;

    path {
        stroke-width: 6;
        stroke: var(--ifealid-orange);
        fill: none;
    }

    text {
        fill: $white;
    }
}
</style>

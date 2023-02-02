<template>
<div class="show-container">
    <nav class="navbar navbar-dark bg-dark">
        <a class="navbar-brand" href="#">
            <img src="/logo.svg" width="30" height="30" class="d-inline-block align-top" alt=""> IFeaLiD
        </a>
        <span v-show="initialized" class="navbar-text text-light font-weight-bold">
            {{dataset.name}} <small>{{dataset.width}}&times;{{dataset.height}}&times;{{dataset.features}} @ {{dataset.precision}}bit</small>
        </span>
        <span></span>
    </nav>
    <div class="main">
        <b-modal
            ref="initModal"
            :no-close-on-backdrop="true"
            :no-close-on-esc="true"
            centered header-bg-variant="dark"
            header-text-variant="light"
            header-border-variant="dark"
            body-bg-variant="dark"
            footer-bg-variant="dark"
            footer-border-variant="dark"
            body-text-variant="light"
            footer-class="modal-footer-center"
            >
            <template #modal-header>
                <h1 class="logo text-center w-100">
                    <img class="d-inline-block align-top" src="/logo.svg" height="50">
                    IFeaLiD
                </h1>
            </template>
            <p>
                 Interactive Feature Localization in Deep neural networks (IFeaLiD) is a web application that allows you to visualize and explore deep neural network layers or any hyperspectral image interactively in the browser. <a href="https://www.frontiersin.org/articles/10.3389/frai.2020.00049">Read the paper</a>.
            </p>
            <p>
                Code and information on how to generate a dataset ZIP file can be found at <a href="https://github.com/BiodataMiningGroup/IFeaLiD">GitHub</a>.
            </p>
            <p class="mb-0">
                Select a dataset ZIP file to start the application.
            </p>
            <div v-if="error" class="alert alert-danger mt-4 mb-0" v-text="errorMessage"></div>
            <template #modal-footer>
                <div v-if="loading" class="spinner-border text-light" role="status">
                    <span class="sr-only">Loading...</span>
                </div>
                <button v-else class="btn btn-primary btn-lg" @click="selectFile">
                    Select ZIP file
                </button>
            </template>
        </b-modal>
        <div class="main-content">
            <Visualization
                ref="visualization"
                v-bind:dataset="dataset"
                v-on:hover="updateHoverPixelVector"
                v-on:select="updateSelectPixelVector"
            ></Visualization>
        </div>
        <div class="main-aside">
            <PixelVectorDisplay
                ref="pixelVectorDisplay"
                v-bind:dataset="dataset"
                v-on:hover="updateHoveredFeature"
            ></PixelVectorDisplay>
        </div>
    </div>
    <input type="file" name="file" accept="application/zip" ref="fileInput" @change="selectedFile" style="display: none;">
</div>
</template>

<script>
import WebglHandler from './webgl/Handler';
import Visualization from './components/Visualization.vue';
import PixelVectorDisplay from './components/PixelVectorDisplay.vue';
import {ZipReader, BlobReader, TextWriter} from "@zip.js/zip.js";
import { BModal } from 'bootstrap-vue';

const DATASET_KEYS = [
    'precision',
    'name',
    'height',
    'width',
    'features',
];

const NUMERIC_FIELDS = [
    'precision',
    'height',
    'width',
    'features',
];

const PRECISION_STEPS = [32, 16, 8];

export default {
    components: {
        Visualization,
        PixelVectorDisplay,
        BModal,
    },
    data() {
        return {
            dataset: {},
            initialized: false,
            loading: false,
            error: null,
        };
    },
    computed: {
        errorMessage() {
            if (this.error) {
                return this.error.message ? this.error.message : this.error;
            }

            return '';
        },
    },
    methods: {
        updateHoverPixelVector(vector) {
            // Use a method instead of prop because the pixel vector array stays the
            // same object.
            this.$refs.pixelVectorDisplay.updatePixelVector(vector);
        },
        updateSelectPixelVector(vector) {
            // Use a method instead of prop because the pixel vector array stays the
            // same object.
            this.$refs.pixelVectorDisplay.updateReferencePixelVector(vector);
        },
        updateHoveredFeature(feature) {
            this.$refs.visualization.showFeature(feature);
        },
        selectFile() {
            this.$refs.fileInput.click();
        },
        selectedFile(e) {
            this.loading = true;
            this.loadDataset(e.target.files[0]);
        },
        verifyDataset(dataset) {
            DATASET_KEYS.forEach(function (key) {
                if (dataset[key] === undefined) {
                    throw Error(`The metadata.json is missing the ${key} field.`);
                }
            });

            NUMERIC_FIELDS.forEach(function (key) {
                if (!Number.isInteger(dataset[key])) {
                    throw Error(`The the ${key} field is not an integer.`);
                }

                if (dataset[key] <= 0) {
                    throw Error(`The the ${key} field must be greater than 0.`);
                }
            });

            if (!PRECISION_STEPS.includes(dataset.precision)) {
                throw Error(`The the precision must be 32, 16 or 8.`);
            }

            let fileMultiplier = dataset.precision / 32;
            let expectedFiles = dataset.features * fileMultiplier;
            let foundFiles = Object.keys(dataset.entries).length;
            if (foundFiles !== expectedFiles) {
                throw new Error(`Wrong number of feature files. Found ${foundFiles} but expected ${expectedFiles}.`);
            }

            if (dataset.overlay && !dataset.overlayEntry) {
                throw new Error('The overlay.jog file is missing.');
            }

            for (let i = expectedFiles - 1; i >= 0; i--) {
                if (!dataset.entries[`${i}.png`]) {
                    throw new Error(`The feature file ${i}.png is missing.`);
                }
            }
        },
        async loadDataset(blobOrFile) {
            try {
                let reader = new ZipReader(new BlobReader(blobOrFile));
                let entries = await reader.getEntries();
                let entryMap = {};
                entries.forEach(e => entryMap[e.filename] = e);
                let metaEntry = entryMap['metadata.json'];

                if (!metaEntry) {
                    throw new Error('The metadata.json file is missing.');
                }

                delete entryMap['metadata.json'];
                let meta = await metaEntry.getData(new TextWriter());
                let dataset = JSON.parse(meta);

                if (dataset.overlay && entryMap['overlay.jpg']) {
                    dataset.overlayEntry = entryMap['overlay.jpg'];
                    delete entryMap['overlay.jpg'];
                }

                dataset.entries = entryMap;
                this.verifyDataset(dataset);

                this.dataset = dataset;
                this.initialized = true;
            } catch (e) {
                this.error = e;
                return;
            } finally {
                this.loading = false;
            }

            this.$refs.initModal.hide();
        },
    },
    mounted() {
        this.$refs.initModal.show();
        let dataset = new URLSearchParams(window.location.search).get('d');
        if (dataset) {
            this.loading = true;
            fetch(`datasets/${dataset}`)
                .then(response => response.blob())
                .then(this.loadDataset)
        }
    },
}
</script>

<style lang="scss">
.show-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;

    .navbar {
        border-bottom: 1px solid $gray-900;
    }
    .main {
        display: flex;
        flex: 1;
        overflow: hidden;
        position: relative;
    }

    .main-content {
        width: 100%;
        height: 100%;
        position: relative;
        flex: 1;
        background-image: url('/noise.png');
    }

    .main-aside {
        height: 100%;
        width: 200px;
        border-left: 1px solid $gray-900;
        position: relative;
        overflow: hidden;
        padding: 10px 0;
        box-sizing: border-box;
    }
}

.modal-footer-center {
    justify-content: center;
}
</style>

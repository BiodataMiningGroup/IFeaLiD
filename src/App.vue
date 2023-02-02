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
            <template #modal-footer>
                <button class="btn btn-primary btn-lg" @click="selectFile">
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
        };
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
            this.$refs.initModal.hide();
            this.loadDataset(e.target.files[0]);
        },
        async loadDataset(blobOrFile) {
            let reader = new ZipReader(new BlobReader(blobOrFile));
            let entries = await reader.getEntries();
            let entryMap = {};
            entries.forEach(e => entryMap[e.filename] = e);
            let metaEntry = entryMap['metadata.json'];
            delete entryMap['metadata.json'];
            let meta = await metaEntry.getData(new TextWriter());
            this.dataset = JSON.parse(meta);

            if (this.dataset.overlay && entryMap['overlay.jpg']) {
                this.dataset.overlayEntry = entryMap['overlay.jpg'];
                delete entryMap['overlay.jpg'];
            }

            this.dataset.entries = entryMap;
            this.initialized = true;
        },
    },
    mounted() {
        let dataset = new URLSearchParams(window.location.search).get('d');
        if (dataset) {
            fetch(`datasets/${dataset}`)
                .then(response => response.blob())
                .then(this.loadDataset)
        } else {
            this.$refs.initModal.show();
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

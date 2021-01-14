# IFeaLiD

![Test](https://github.com/BiodataMiningGroup/IFeaLiD/workflows/Test/badge.svg)

Interactive Feature Localization in Deep neural networks (IFeaLiD) is a web application that allows you to visualize and explore deep neural network layers or any hyperspectral image interactively in the browser. Read [the paper](https://www.frontiersin.org/articles/10.3389/frai.2020.00049).

IFeaLiD is available at [ifealid.cebitec.uni-bielefeld.de](https://ifealid.cebitec.uni-bielefeld.de).

## Examples

### Datasets

These are the examples that were presented in the [paper](https://www.frontiersin.org/articles/10.3389/frai.2020.00049):

#### Cityscapes Dataset (`bielefeld_000000_007186_leftImg8bit.png`)

- conv2_x: <https://ifealid.cebitec.uni-bielefeld.de/s/XLR0nEoJYC>

- conv3_x: <https://ifealid.cebitec.uni-bielefeld.de/s/mBewo8bZU5>

- conv4_x: <https://ifealid.cebitec.uni-bielefeld.de/s/7GJCsnwDAY>

#### COCO Dataset (`000000015746.jpg`)

- conv2_x: <https://ifealid.cebitec.uni-bielefeld.de/s/8zD3GhhbLu>

- conv3_x: <https://ifealid.cebitec.uni-bielefeld.de/s/dqPo2zLZUN>

- conv4_x: <https://ifealid.cebitec.uni-bielefeld.de/s/qQq7sHC17Y>

#### DIV2K Dataset (`0804.png`)

- conv2_x: <https://ifealid.cebitec.uni-bielefeld.de/s/4fatmqKCRe>

- conv3_x: <https://ifealid.cebitec.uni-bielefeld.de/s/8pSj1gRiJg>

- conv4_x: <https://ifealid.cebitec.uni-bielefeld.de/s/HcjH3odgYY>

#### DOTA Dataset (`P0034.png`)

- conv2_x: <https://ifealid.cebitec.uni-bielefeld.de/s/UdNkZg466L>

- conv3_x: <https://ifealid.cebitec.uni-bielefeld.de/s/JxfLdUe2rB>

- conv4_x: <https://ifealid.cebitec.uni-bielefeld.de/s/7PHgCj98hU>

### Feature Extraction

The code that was used to extract the feature maps from ResNet101 for the examples is provided in [`examples/feature-extraction`](examples/feature-extraction). Usage:

1. Load the submodule of the Mask R-CNN repository: `git submodule update --init`

2. Install the requirements: `pip3 install -r examples/feature-extraction/requirements.txt`

3. Execute the script: `python3 examples/feature-extraction/resnet_feature_extraction.py <target directory> <image1> <image2> ...`

By default, the script extracts feature maps at five stages of ResNet101. The feature maps conv2_x, conv3_x and conv4_x correspond to the files with suffix `C1.npz`, `C2.npz` and `C3.npz`, respectively.

## Generating a Dataset

The script to generate an IFeaLiD dataset ZIP file from a NumPy array can be found in [`resources/scripts`](resources/scripts). Usage:

1. Install the requirements: `pip3 install -r resources/scripts/requirements.txt`

2. Generate the feature map as NumPy array and store it as a file (see above)

3. Execute the script: `python3 resources/scripts/dataset-zip-creator.py <file>`

The script supports the following options:

- `-n`, `--name`: Optional dataset name. Default is the filename of the NumPy file.
- `-p`, `--precision`: Dataset numeric precision in bits (`8`, `16` or `32`). Default is `8`.
- `-o`, `--overlay`: Optional path to the original input image. If supplied, the input image is displayed in IFeaLiD and can be blended with the heat map visualization.

## Installation

[Docker](https://docs.docker.com/install/) and [Docker Compose](https://docs.docker.com/compose/install/) are recommended to run IFeaLiD.

### Developing

1. Install [Composer](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-macos).
2. Run:
    ```
    composer create-project ifealid/ifealid:dev-master \
        --repository='{"type":"vcs","url":"git@github.com:BiodataMiningGroup/IFeaLiD.git"}' \
        --keep-vcs \
        --ignore-platform-reqs \
        --prefer-source ifealid
    ```
3. Switch to the `ifealid` directory.
4. Run `php artisan serve`.

The application is now running at `http://localhost:8000`.

**To develop the JavaScript files:**

1. Run `npm install`.
2. Run `npm run watch` during development.
3. Run `npm run prod` to compile the files for production.

**To build the Docker images:**

Run `docker-compose build`.

### Production

An example for a production configuration can be found in [`examples/production`](examples/production). 

1. Copy the content to your server.
2. Copy the file `.env.example` to `.env` and configure the user, group and timezone that should be used to run the application.
3. Copy the file `build/.env.example` to `build/.env` and configure the `APP_KEY` and `APP_URL`. Generate an `APP_KEY` with: `head -c 32 /dev/urandom | base64`. Then set `APP_KEY=base64:<your_key>`.
4. Run `docker-compose up -d`.

## Citation

Please cite our paper if it is helpful to your work:

```
@article{zurowietz2020interactive,
  title={An Interactive Visualization for Feature Localization in Deep Neural Networks},
  author={Zurowietz, Martin and Nattkemper, Tim Wilhelm},
  journal={Frontiers in Artificial Intelligence-Machine Learning and Artificial Intelligence},
  year={2020},
  doi={10.3389/frai.2020.00049}
}
```

## References

- [**Mask R-CNN for Object Detection and Segmentation**](https://github.com/matterport/Mask_RCNN)

- [**IFeaLiD Example Datasets**](https://doi.org/10.5281/zenodo.3741485)

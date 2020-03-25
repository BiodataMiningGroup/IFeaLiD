# IFeaLiD

Interactive Feature Localization in Deep neural networks (IFeaLiD) is a web application that allows you to visualize and explore deep neural network layers or any hyperspectral image interactively in the browser. Read [the paper](#).

IFeaLiD is available at [ifealid.cebitec.uni-bielefeld.de](https://ifealid.cebitec.uni-bielefeld.de).

## Installation

[Docker](https://docs.docker.com/install/) and [Docker Compose](https://docs.docker.com/compose/install/) are recommended to run IFeaLiD.

### Developing

1. Install [Composer](https://getcomposer.org/doc/00-intro.md#installation-linux-unix-macos).
2. Run:
    ```
    composer create-project ifealid/ifealid \
        --repository='{"type":"vcs","url":"git@github.com:BiodataMiningGroup/IFeaLiD.git"}' \
        --keep-vcs \
        --ignore-platform-reqs \
        --prefer-source ifealid
    ```
3. Switch to the `ifealid` directory.
4. Run `docker-compose up`.

The application is now running at `http://localhost:8000`.

**To develop the JavaScript files:**

1. Run `npm install`.
2. Run `npm run watch` during development.
3. Run `npm run prod` to compile the files for production.

**To build the Docker images:**

Run `docker-compose build`.

### Production

An example for a production configuration can be found in [`.docker/production-example`](.docker/production-example). 

1. Copy the content to your server.
2. Copy the file `.env.example` to `.env` and configure the user, group and timezone that should be used to run the application.
3. Copy the file `build/.env.example` to `build/.env` and configure the `APP_KEY` and `APP_URL`.
4. Run `docker-compose up -d`.

## References

-

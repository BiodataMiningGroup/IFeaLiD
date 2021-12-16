FROM php:7.4-fpm-alpine
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

RUN apk add --no-cache \
        openssl \
        libxml2 \
        libzip-dev \
        sqlite-libs
RUN docker-php-ext-install \
        bcmath \
        zip

ADD .docker/php.ini /usr/local/etc/php/conf.d/php.ini

COPY composer.lock composer.json /var/www/

COPY database /var/www/database

WORKDIR /var/www

ENV COMPOSER_NO_INTERACTION 1
ENV COMPOSER_ALLOW_SUPERUSER 1
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && COMPOSER_SIGNATURE=$(curl -s https://composer.github.io/installer.sig) \
    && php -r "if (hash_file('SHA384', 'composer-setup.php') === '$COMPOSER_SIGNATURE') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;" \
    && php composer-setup.php \
    && rm composer-setup.php \
    && php composer.phar install --no-dev --no-scripts \
    && rm -r ~/.composer

COPY . /var/www

# This is required so the artisan optimize command does not fail.
RUN mkdir -p /var/www/storage/framework/views

RUN php composer.phar dump-autoload -o \
    && rm composer.phar

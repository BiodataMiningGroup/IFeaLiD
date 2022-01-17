FROM docker.pkg.github.com/biodatamininggroup/ifealid/app as intermediate

FROM nginx:1.16-alpine
MAINTAINER Martin Zurowietz <martin@cebitec.uni-bielefeld.de>

ADD .docker/vhost.conf /etc/nginx/conf.d/default.conf
ADD .docker/ffdhe2048.txt /etc/nginx/conf.d/ffdhe2048.txt

COPY --from=intermediate /var/www/public /var/www/public

FROM docker.pkg.github.com/biodatamininggroup/ifealid/app:latest

# Configure the timezone.
ARG TIMEZONE
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/${TIMEZONE} /etc/localtime \
    && echo "${TIMEZONE}" > /etc/timezone \
    && apk del tzdata

RUN php /var/www/artisan route:cache
COPY .env /var/www/.env
RUN php /var/www/artisan config:cache && rm /var/www/.env

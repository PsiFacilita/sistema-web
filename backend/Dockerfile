# ===== Stage 1: vendor (Composer) =====
FROM composer:2.7 AS vendor
WORKDIR /app

# Copie apenas o que o Composer precisa primeiro (melhor cache)
COPY composer.json composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --optimize-autoloader

# ===== Stage 2: runtime (php-fpm) =====
FROM php:8.3-fpm-alpine

# Instala extensões úteis para APIs (ajuste se precisar de mais)
RUN set -eux; \
    apk add --no-cache icu-dev tzdata oniguruma-dev; \
    docker-php-ext-install -j$(nproc) pdo pdo_mysql intl opcache; \
    rm -rf /var/cache/apk/*

# Timezone
ENV TZ=America/Sao_Paulo

# Diretório da aplicação
WORKDIR /var/www/html

# Copia o código da API
COPY . .

# Copia dependências do Composer da stage vendor
COPY --from=vendor /app/vendor /var/www/html/vendor

# Configurações PHP
COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-app.ini
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/10-opcache.ini

# Permissões (ajuste se usar storage/logs, cache, etc.)
RUN addgroup -g 1000 app && adduser -D -G app -u 1000 app && \
    chown -R app:app /var/www/html
USER app

EXPOSE 9000
CMD ["php-fpm"]

# Usar Node.js 18 LTS como imagen base
FROM node:18-alpine

# Instalar dependencias del sistema necesarias para Puppeteer y WhatsApp Web
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Configurar Puppeteer para usar Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production && npm cache clean --force

# Copiar el código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p data logs .wwebjs_auth session

# Configurar permisos
RUN chown -R node:node /app
USER node

# Exponer el puerto del panel web
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV WEB_USERNAME=admin
ENV WEB_PASSWORD=inted2025

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
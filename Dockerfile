FROM node:20-alpine

WORKDIR /app

# Installer Docker CLI (nécessaire pour dockerode)
RUN apk add --no-cache docker-cli

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY src/ ./src/

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1000 nodeuser && \
    adduser -D -u 1000 -G nodeuser nodeuser && \
    chown -R nodeuser:nodeuser /app

USER nodeuser

# Exposer le port (optionnel, pour health check)
EXPOSE 8080

# Commande de démarrage
CMD ["node", "src/index.js"]


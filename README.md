# DevOUPS Agent

Agent léger pour la gestion des conteneurs Docker sur les serveurs distants via WebSocket.

## 🚀 Fonctionnalités

- **Gestion Docker** : Liste, démarrage, arrêt, redémarrage de conteneurs
- **Logs en temps réel** : Récupération et streaming des logs Docker
- **Statistiques** : Monitoring des performances des conteneurs
- **Communication WebSocket** : Connexion permanente avec reconnexion automatique
- **Heartbeat** : Envoi périodique de l'état du serveur
- **Sécurité** : Validation des commandes, sanitization des paramètres

## 📋 Prérequis

- Node.js 18+
- Docker installé et en cours d'exécution
- Accès au socket Docker (`/var/run/docker.sock`)

## 🛠️ Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Modifier .env selon vos besoins
```

## ⚙️ Configuration

Variables d'environnement (`.env`) :

```env
# Backend WebSocket URL
AGENT_BACKEND_URL=wss://api.devoups.io/agent/connect

# Authentification
AGENT_TOKEN=your-jwt-token-here

# Identification du serveur
AGENT_HOSTNAME=server-01
AGENT_SERVER_ID=uuid-from-database

# Configuration
AGENT_HEARTBEAT_INTERVAL=30000
AGENT_RECONNECT_DELAY=5000
AGENT_LOG_LEVEL=info
```

## 🚀 Utilisation

### Développement

```bash
npm run dev
```

### Production

```bash
npm start
```

### Avec Docker

```bash
# Construire l'image
docker build -t devoups-agent:latest .

# Lancer le conteneur
docker run -d \
  --name devoups-agent \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e AGENT_BACKEND_URL=wss://api.devoups.io/agent/connect \
  -e AGENT_TOKEN=your-token \
  -e AGENT_HOSTNAME=server-01 \
  devoups-agent:latest
```

### Avec Docker Compose

```bash
docker-compose up -d
```

## 📡 Protocole de communication

### Messages reçus du backend

```json
{
  "id": "uuid-request",
  "action": "docker.list",
  "params": {}
}
```

```json
{
  "id": "uuid-request",
  "action": "docker.start",
  "params": {
    "container": "webapp-container"
  }
}
```

```json
{
  "id": "uuid-request",
  "action": "docker.logs",
  "params": {
    "container": "webapp-container",
    "tail": 100,
    "follow": true
  }
}
```

### Messages envoyés au backend

**Réponse de succès :**
```json
{
  "type": "response",
  "id": "uuid-request",
  "success": true,
  "data": { ... }
}
```

**Stream de logs :**
```json
{
  "type": "stream",
  "id": "uuid-request",
  "stream": "stdout",
  "data": "Container started successfully"
}
```

**Heartbeat :**
```json
{
  "type": "heartbeat",
  "hostname": "server-01",
  "status": "online",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🐳 Actions Docker supportées

- `docker.list` - Liste les conteneurs
- `docker.inspect` - Inspecte un conteneur
- `docker.start` - Démarre un conteneur
- `docker.stop` - Arrête un conteneur
- `docker.restart` - Redémarre un conteneur
- `docker.logs` - Récupère les logs (avec option `follow` pour le streaming)
- `docker.stats` - Récupère les statistiques (avec option `stream` pour le temps réel)
- `docker.exec` - Exécute une commande dans un conteneur

## 🏗️ Architecture

```
devoups-agent/
├── src/
│   ├── index.js                 # Point d'entrée
│   ├── config/
│   │   └── env.js               # Configuration
│   ├── websocket/
│   │   ├── client.js            # Client WebSocket
│   │   └── handlers.js          # Gestionnaires de messages
│   ├── modules/
│   │   └── docker/
│   │       ├── manager.js       # Gestionnaire Docker
│   │       └── actions.js       # Actions Docker
│   ├── utils/
│   │   ├── logger.js            # Logger
│   │   ├── validator.js         # Validation
│   │   └── executor.js          # Exécution de commandes
│   └── types/
│       └── messages.js          # Types de messages
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 🔒 Sécurité

- Validation de toutes les actions Docker (liste blanche)
- Sanitization des noms de conteneurs
- Authentification via token JWT
- Communication sortante uniquement (pas de port d'écoute)
- Exécution en utilisateur non-root dans le conteneur

## 📝 Logs

Les logs sont structurés avec les niveaux suivants :
- `error` : Erreurs critiques
- `warn` : Avertissements
- `info` : Informations générales
- `debug` : Informations de débogage

Le niveau de log est configurable via `AGENT_LOG_LEVEL`.

## 🔮 Extensions futures

- Module HAProxy
- Module Fail2Ban
- Module UFW
- Collecte de métriques système (CPU, RAM, Disk)
- Gestion des backups

## 📄 Licence

ISC


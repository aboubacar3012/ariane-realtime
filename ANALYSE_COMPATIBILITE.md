# Analyse de compatibilité : Agent vs Documentation

> ✅ **Mise à jour (Option 1 implémentée)** : l'agent expose désormais un serveur WebSocket frontal (`createFrontendServer`) avec authentification par token. Les instructions ci-dessous restent utiles pour comprendre le décalage initial et les changements appliqués.

## 🔍 Problème identifié

L'agent actuel **n'est PAS compatible** avec la documentation créée. Il y a un décalage architectural important.

## 📊 Architecture actuelle de l'agent

```
Frontend → Backend (Next.js API routes) → Agent (Client WebSocket) → Docker
```

**Caractéristiques :**
- ✅ L'agent est un **CLIENT WebSocket** qui se connecte au backend
- ✅ Il reçoit des messages du backend via WebSocket
- ✅ Il exécute les actions Docker
- ✅ Il renvoie les réponses au backend
- ❌ Il **n'expose PAS** de serveur WebSocket
- ❌ Il **n'accepte PAS** de connexions directes du frontend

## 📋 Ce que la documentation suppose

```
Frontend → Agent (Serveur WebSocket) → Docker
```

**Caractéristiques attendues :**
- ❌ L'agent devrait exposer un **serveur WebSocket**
- ❌ Le frontend devrait pouvoir se connecter directement à l'agent
- ❌ L'agent devrait accepter des connexions avec `token` et `serverId` en paramètres

## 🔧 Modifications nécessaires

Pour que l'agent fonctionne avec la documentation, il faut :

### 1. Ajouter un serveur WebSocket HTTP

Créer un serveur HTTP avec WebSocket (comme `devoups-terminal-backend`) :

```javascript
// src/websocket/server.js (à créer)
import http from 'http';
import { WebSocketServer } from 'ws';
import { handleMessage } from './handlers.js';

export function createWebSocketServer(port, dockerManager) {
  const server = http.createServer();
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    // Extraire token et serverId depuis l'URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const serverId = url.searchParams.get('serverId');

    // Valider le token et serverId
    if (!token || !serverId) {
      ws.close(1008, 'Token et serverId requis');
      return;
    }

    // Gérer les messages du frontend
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(message, (response) => {
          if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify(response));
          }
        });
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message
        }));
      }
    });
  });

  server.listen(port, () => {
    logger.info(`Serveur WebSocket démarré sur le port ${port}`);
  });

  return server;
}
```

### 2. Modifier `src/index.js`

```javascript
import { createWebSocketServer } from './websocket/server.js';

async function main() {
  const config = loadConfig();
  
  // Initialiser Docker
  initDocker(config.dockerSocketPath);

  // Créer le serveur WebSocket pour le frontend
  const frontendPort = process.env.AGENT_FRONTEND_PORT || 7080;
  const frontendServer = createWebSocketServer(frontendPort, dockerManager);

  // Garder le client WebSocket pour le backend (optionnel)
  if (config.backendUrl) {
    const wsClient = new AgentWebSocketClient(config, dockerManager);
    await wsClient.connect();
  }
}
```

### 3. Ajouter la configuration

Dans `src/config/env.js` :

```javascript
frontendPort: parseInt(process.env.AGENT_FRONTEND_PORT || "7080", 10),
```

Dans `env.example` :

```env
# Port pour les connexions frontend
AGENT_FRONTEND_PORT=7080
```

### 4. Mettre à jour les dépendances

Le package `ws` est déjà présent, mais il faudra peut-être ajouter `http` (déjà dans Node.js).

## 🎯 Options

### Option 1 : Modifier l'agent (recommandé si vous voulez la connexion directe)

Implémenter les modifications ci-dessus pour que l'agent expose un serveur WebSocket.

**Avantages :**
- ✅ Compatible avec la documentation
- ✅ Connexion directe frontend → agent
- ✅ Pas besoin de backend intermédiaire

**Inconvénients :**
- ⚠️ Nécessite des modifications du code
- ⚠️ L'agent doit gérer l'authentification frontend
- ⚠️ Exposition d'un port supplémentaire

### Option 2 : Modifier la documentation

Adapter la documentation pour refléter l'architecture actuelle :

```
Frontend → Next.js API Routes → Backend WebSocket → Agent → Docker
```

**Avantages :**
- ✅ Aucune modification du code nécessaire
- ✅ Architecture actuelle fonctionne déjà

**Inconvénients :**
- ⚠️ Nécessite un backend intermédiaire
- ⚠️ Plus de latence (plus de sauts)

## 📝 Recommandation

Si vous voulez une architecture similaire au terminal (connexion directe), **Option 1** est recommandée. Sinon, **Option 2** pour garder l'architecture actuelle.

## 🔍 Fichiers à modifier (Option 1)

1. ✅ Créer `src/websocket/server.js` (nouveau fichier)
2. ✅ Modifier `src/index.js` (ajouter le serveur WebSocket)
3. ✅ Modifier `src/config/env.js` (ajouter `AGENT_FRONTEND_PORT`)
4. ✅ Modifier `env.example` (ajouter la variable)
5. ✅ Modifier `README.md` (mettre à jour la section sécurité - l'agent écoute maintenant)

## ⚠️ Note importante

Actuellement, le README indique :
> "Communication sortante uniquement (pas de port d'écoute)"

Si vous implémentez l'Option 1, cette ligne devra être modifiée car l'agent écoutera sur un port pour les connexions frontend.


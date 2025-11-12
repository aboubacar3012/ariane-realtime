/**
 * Point d'entrée principal de l'agent DevOUPS
 * @module index
 */

import { loadConfig } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { AgentWebSocketClient } from "./websocket/client.js";
import { initDocker } from "./modules/docker/manager.js";

/**
 * Fonction principale
 */
async function main() {
  try {
    // Charger la configuration
    const config = loadConfig();
    logger.info("Démarrage de l'agent DevOUPS", {
      hostname: config.hostname,
      backendUrl: config.backendUrl,
    });

    // Initialiser Docker
    initDocker(config.dockerSocketPath);

    // Créer et démarrer le client WebSocket
    const wsClient = new AgentWebSocketClient(config, null);
    await wsClient.connect();

    // Gérer l'arrêt propre
    process.on("SIGTERM", () => {
      logger.info("Signal SIGTERM reçu, arrêt en cours...");
      wsClient.disconnect();
      process.exit(0);
    });

    process.on("SIGINT", () => {
      logger.info("Signal SIGINT reçu, arrêt en cours...");
      wsClient.disconnect();
      process.exit(0);
    });

    // Gérer les erreurs non capturées
    process.on("uncaughtException", (error) => {
      logger.error("Exception non capturée", { error: error.message });
      wsClient.disconnect();
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Rejet non géré", {
        reason: reason?.message || reason,
        promise,
      });
    });
  } catch (error) {
    logger.error("Erreur fatale lors du démarrage", {
      error: error.message,
    });
    process.exit(1);
  }
}

// Démarrer l'agent
main();


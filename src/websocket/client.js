/**
 * Client WebSocket pour l'agent DevOUPS
 * @module websocket/client
 */

import WebSocket from "ws";
import { logger } from "../utils/logger.js";
import { handleMessage } from "./handlers.js";
import { createHeartbeat } from "../types/messages.js";
import { initDocker } from "../modules/docker/manager.js";

/**
 * Client WebSocket avec reconnexion automatique
 */
export class AgentWebSocketClient {
  constructor(config, dockerManager) {
    this.config = config;
    this.dockerManager = dockerManager;
    this.ws = null;
    this.reconnectDelay = config.reconnectDelay;
    this.maxReconnectDelay = config.reconnectMaxDelay;
    this.heartbeatInterval = null;
    this.isConnecting = false;
    this.shouldReconnect = true;
  }

  /**
   * Se connecte au backend
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Initialiser Docker
      initDocker(this.config.dockerSocketPath);

      const url = `${this.config.backendUrl}?token=${encodeURIComponent(this.config.token)}&hostname=${encodeURIComponent(this.config.hostname)}`;

      logger.info("Connexion au backend", { url: this.config.backendUrl });

      this.ws = new WebSocket(url);

      this.ws.on("open", () => {
        logger.info("Connecté au backend", {
          hostname: this.config.hostname,
        });
        this.isConnecting = false;
        this.reconnectDelay = this.config.reconnectDelay;
        this.startHeartbeat();
      });

      this.ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          handleMessage(message, (response) => {
            this.send(response);
          });
        } catch (error) {
          logger.error("Erreur lors du parsing du message", {
            error: error.message,
          });
        }
      });

      this.ws.on("error", (error) => {
        logger.error("Erreur WebSocket", { error: error.message });
        this.isConnecting = false;
      });

      this.ws.on("close", (code, reason) => {
        logger.warn("Connexion fermée", {
          code,
          reason: reason.toString(),
        });
        this.stopHeartbeat();
        this.isConnecting = false;

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      });
    } catch (error) {
      logger.error("Erreur lors de la connexion", { error: error.message });
      this.isConnecting = false;
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Envoie un message au backend
   * @param {Object} message - Message à envoyer
   */
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error("Erreur lors de l'envoi du message", {
          error: error.message,
        });
      }
    } else {
      logger.warn("Tentative d'envoi sur une connexion fermée");
    }
  }

  /**
   * Démarre le heartbeat
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      const heartbeat = createHeartbeat(
        this.config.hostname,
        this.config.serverId
      );
      this.send(heartbeat);
    }, this.config.heartbeatInterval);
  }

  /**
   * Arrête le heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Programme une reconnexion avec backoff exponentiel
   */
  scheduleReconnect() {
    const delay = this.reconnectDelay;
    logger.info("Reconnexion programmée", { delay: `${delay}ms` });

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, delay);

    // Augmenter le délai pour la prochaine fois (backoff exponentiel)
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2,
      this.maxReconnectDelay
    );
  }

  /**
   * Déconnecte proprement le client
   */
  disconnect() {
    this.shouldReconnect = false;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }
}


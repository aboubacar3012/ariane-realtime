/**
 * Configuration et validation des variables d'environnement
 * @module config/env
 */

import dotenv from "dotenv";

// Charger les variables d'environnement
dotenv.config();

/**
 * Charge et valide la configuration
 * @returns {Object} Configuration validée
 * @throws {Error} Si une variable requise est manquante
 */
export function loadConfig() {
  const required = [
    "AGENT_BACKEND_URL",
    "AGENT_TOKEN",
    "AGENT_HOSTNAME",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(", ")}`
    );
  }

  return {
    backendUrl: process.env.AGENT_BACKEND_URL,
    token: process.env.AGENT_TOKEN,
    hostname: process.env.AGENT_HOSTNAME,
    serverId: process.env.AGENT_SERVER_ID || null,
    heartbeatInterval: parseInt(
      process.env.AGENT_HEARTBEAT_INTERVAL || "30000",
      10
    ),
    reconnectDelay: parseInt(
      process.env.AGENT_RECONNECT_DELAY || "5000",
      10
    ),
    reconnectMaxDelay: parseInt(
      process.env.AGENT_RECONNECT_MAX_DELAY || "60000",
      10
    ),
    logLevel: process.env.AGENT_LOG_LEVEL || "info",
    dockerSocketPath:
      process.env.DOCKER_SOCKET_PATH || "/var/run/docker.sock",
  };
}


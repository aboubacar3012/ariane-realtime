/**
 * Exécution sécurisée de commandes système
 * @module utils/executor
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Exécute une commande shell de manière sécurisée
 * @param {string} command - Commande à exécuter
 * @param {Object} [options] - Options d'exécution
 * @param {number} [options.timeout=30000] - Timeout en ms
 * @param {number} [options.maxBuffer=10*1024*1024] - Taille max du buffer
 * @returns {Promise<{stdout: string, stderr: string}>} Résultat de la commande
 */
export async function executeCommand(command, options = {}) {
  const {
    timeout = 30000,
    maxBuffer = 10 * 1024 * 1024, // 10MB
  } = options;

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      maxBuffer,
    });
    return { stdout, stderr };
  } catch (error) {
    return {
      stdout: error.stdout || "",
      stderr: error.stderr || error.message || "",
      error: true,
    };
  }
}


const axios = require('axios');
const config = require('../config/env');

const client = axios.create({
  baseURL: config.aiServiceUrl,
  timeout: config.aiServiceTimeout,
});

const isUp = async () => {
  try {
    await client.get('/health', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
};

const call = async (path, payload) => {
  const { data } = await client.post(path, payload);
  return data;
};

/**
 * tryAi — call the FastAPI service, but degrade gracefully to a heuristic
 * fallback when the service is down or slow. Keeps the prototype fully
 * functional without the Python stack running.
 */
const tryAi = async (path, payload, fallback) => {
  try {
    return await call(path, payload);
  } catch (err) {
    console.warn(`[ai-client] ${path} unavailable (${err.message}). Using heuristic fallback.`);
    return fallback();
  }
};

module.exports = { client, isUp, call, tryAi };

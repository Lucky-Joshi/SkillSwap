const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');
const { recordAiRequest } = require('../utils/metrics');

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
  const start = Date.now();
  try {
    const { data } = await client.post(path, payload);
    recordAiRequest(true, Date.now() - start);
    return data;
  } catch (err) {
    recordAiRequest(false, Date.now() - start);
    throw err;
  }
};

const tryAi = async (path, payload, fallback) => {
  try {
    return await call(path, payload);
  } catch (err) {
    logger.warn(`AI service ${path} unavailable: ${err.message}. Using heuristic fallback.`);
    return fallback();
  }
};

module.exports = { client, isUp, call, tryAi };

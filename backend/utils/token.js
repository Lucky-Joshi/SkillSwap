const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

const signToken = (userId) =>
  jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

const randomToken = () => crypto.randomBytes(32).toString('hex');

module.exports = { signToken, verifyToken, randomToken };

/* logger.js — Pino logger with MongoDB transport + Express middleware */
'use strict';

const pino = require('pino');
const Log  = require('./models/logs');

/*
 * Custom Pino transport: writes each log entry to the MongoDB logs collection.
 * pino calls write() with a JSON string for every log event.
 */
const mongoTransport = {
  write(chunk) {
    // Parse the JSON Pino produces
    let entry;
    try {
      entry = JSON.parse(chunk);
    } catch (_) {
      return;
    }
    // Persist to MongoDB — fire-and-forget, errors only go to stderr
    Log.create({
      level:      entry.level,
      time:       entry.time ? new Date(entry.time) : new Date(),
      msg:        entry.msg,
      method:     entry.method,
      url:        entry.url,
      status:     entry.status,
      durationMs: entry.durationMs,
      meta:       entry,
    }).catch((err) => process.stderr.write(`Log write failed: ${err.message}\n`));
  },
};

// Pino instance pointing at our MongoDB transport
const logger = pino({ level: 'info' }, mongoTransport);

/*
 * httpLogger — Express middleware.
 * Writes one `http_request` log entry per incoming request (L3 requirement).
 */
const httpLogger = (req, res, next) => {
  const start = Date.now();

  // Log after the response is sent so we can capture the status code
  res.on('finish', () => {
    logger.info({
      msg:        'http_request',
      method:     req.method,
      url:        req.originalUrl,
      status:     res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
};

/*
 * logEndpoint — call at the top of each route handler (L4 requirement).
 * Writes one `endpoint_access` entry whenever an endpoint is accessed.
 */
const logEndpoint = (name, meta) => {
  logger.info({ msg: `endpoint_access:${name}`, meta: meta || {} });
};

module.exports = { logger, httpLogger, logEndpoint };

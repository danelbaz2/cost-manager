// Pino logging that ends up in MongoDB, plus a couple of express helpers
'use strict';

const pino = require('pino');
const Log  = require('./models/logs');

// Pino hands every log line to write() as a JSON string; we turn that back
// into an object and drop it into the logs collection.
const mongoTransport = {
  write(chunk) {
    let entry;
    try {
      entry = JSON.parse(chunk);
    } catch (_) {
      return;
    }
    // fire-and-forget; if the write fails we just print it, logging shouldn't
    // be able to take a request down
    Log.create({
      // map the pino fields onto our log document
      level:      entry.level,
      time:       entry.time ? new Date(entry.time) : new Date(),
      msg:        entry.msg,
      method:     entry.method,
      url:        entry.url,
      status:     entry.status,
      durationMs: entry.durationMs,
      // only the endpoint-specific payload; the rest of the pino line is
      // already mapped to the columns above
      meta:       entry.meta || {},
    }).catch((err) => process.stderr.write(`Log write failed: ${err.message}\n`));
  },
};

const logger = pino({ level: 'info' }, mongoTransport);

// one log line per request — wait for 'finish' so we know the status code
const httpLogger = (req, res, next) => {
  const start = Date.now();

  // wait until the response is done so we have the status and timing
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

// call this from a handler to record that the endpoint itself was hit
const logEndpoint = (name, meta) => {
  logger.info({ msg: `endpoint_access:${name}`, meta: meta || {} });
};

module.exports = { logger, httpLogger, logEndpoint };

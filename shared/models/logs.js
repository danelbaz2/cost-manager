/* models/logs.js — Mongoose schema and model for the logs collection */
'use strict';

const mongoose = require('mongoose');

/*
 * Each document represents one log event written by Pino.
 * Property names here are exactly what GET /api/logs returns.
 */
const logSchema = new mongoose.Schema({
  level:      { type: Number },
  time:       { type: Date, default: Date.now },
  msg:        { type: String },
  method:     { type: String },
  url:        { type: String },
  status:     { type: Number },
  durationMs: { type: Number },
  // catch-all for any extra Pino fields
  meta:       { type: Object },
});

module.exports = mongoose.model('Log', logSchema);

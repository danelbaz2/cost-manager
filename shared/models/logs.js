// the logs collection — one document per log line Pino emits
'use strict';

const mongoose = require('mongoose');

// the fields we pull off a Pino entry; everything goes out as-is on GET /api/logs
const logSchema = new mongoose.Schema({
  level:      { type: Number },
  time:       { type: Date, default: Date.now },
  msg:        { type: String },
  method:     { type: String },
  url:        { type: String },
  status:     { type: Number },
  durationMs: { type: Number },
  // anything else Pino sends just lands here
  meta:       { type: Object },
});

module.exports = mongoose.model('Log', logSchema);

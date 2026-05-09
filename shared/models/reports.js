/* models/reports.js — Mongoose schema for the computed monthly report cache */
'use strict';

const mongoose = require('mongoose');

/*
 * Computed Design Pattern cache:
 * When a past-month report is first computed, the full JSON payload is stored
 * here. Subsequent requests for the same (userid, year, month) return the
 * stored payload without re-running the aggregation pipeline.
 *
 * The unique index ensures two concurrent requests cannot insert duplicate rows.
 */
const reportSchema = new mongoose.Schema({
  userid:    { type: Number, required: true },
  year:      { type: Number, required: true },
  month:     { type: Number, required: true, min: 1, max: 12 },
  // Full response JSON — returned as-is on cache hit
  payload:   { type: Object, required: true },
  createdAt: { type: Date,   default: Date.now },
});

// Unique compound index enforces one cached entry per user/year/month
reportSchema.index({ userid: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);

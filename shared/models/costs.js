/* models/costs.js — Mongoose schema and model for the costs collection */
'use strict';

const mongoose = require('mongoose');

// All five categories the spec requires
const CATEGORIES = ['food', 'health', 'housing', 'sports', 'education'];

/*
 * `sum` must be stored as Double per the spec.
 * `date` defaults to the time the request is received when not provided.
 */
const costSchema = new mongoose.Schema({
  description: { type: String,                            required: true },
  category:    { type: String, enum: CATEGORIES,          required: true },
  userid:      { type: Number,                            required: true },
  sum:         { type: mongoose.Schema.Types.Double,      required: true },
  date:        { type: Date,   default: Date.now },
});

// Index on userid + date to speed up monthly report queries
costSchema.index({ userid: 1, date: 1 });

module.exports = mongoose.model('Cost', costSchema);
module.exports.CATEGORIES = CATEGORIES;

// cached monthly reports — see getReport() in the costs service for the why
'use strict';

const mongoose = require('mongoose');

// once a past month's report is built we keep the whole payload here and just
// hand it back next time instead of re-running the aggregation
const reportSchema = new mongoose.Schema({
  userid:    { type: Number, required: true },
  year:      { type: Number, required: true },
  month:     { type: Number, required: true, min: 1, max: 12 },
  payload:   { type: Object, required: true },
  createdAt: { type: Date,   default: Date.now },
});

// one cached report per user/year/month
reportSchema.index({ userid: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);

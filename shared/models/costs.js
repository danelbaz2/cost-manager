// the costs collection
'use strict';

const mongoose = require('mongoose');

// the categories a cost can fall under
const CATEGORIES = ['food', 'health', 'housing', 'sports', 'education'];

const costSchema = new mongoose.Schema({
  description: { type: String,                            required: true },
  category:    { type: String, enum: CATEGORIES,          required: true },
  userid:      { type: Number,                            required: true },
  // money is a Double, and the date defaults to whenever the cost came in
  sum:         { type: mongoose.Schema.Types.Double,      required: true },
  date:        { type: Date,   default: Date.now },
});

// the monthly report always filters by user + date, so index those
costSchema.index({ userid: 1, date: 1 });

module.exports = mongoose.model('Cost', costSchema);
module.exports.CATEGORIES = CATEGORIES;

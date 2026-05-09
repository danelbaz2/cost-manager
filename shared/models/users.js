/* models/users.js — Mongoose schema and model for the users collection */
'use strict';

const mongoose = require('mongoose');

/*
 * The spec requires these exact field names and types.
 * Note: `id` (Number) is different from `_id` (ObjectId) — never mix them.
 */
const userSchema = new mongoose.Schema({
  id:         { type: Number, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name:  { type: String, required: true },
  birthday:   { type: Date,   required: true },
});

// unique: true on the id field already creates an index — no extra call needed

module.exports = mongoose.model('User', userSchema);

// the users collection
'use strict';

const mongoose = require('mongoose');

// our own numeric id lives alongside Mongo's _id — they're not the same thing
const userSchema = new mongoose.Schema({
  id:         { type: Number, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name:  { type: String, required: true },
  birthday:   { type: Date,   required: true },
});

module.exports = mongoose.model('User', userSchema);

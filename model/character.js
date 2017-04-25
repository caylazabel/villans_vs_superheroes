'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const characterSchema = Schema({
  name: { type: String, required: true },
  story: { type: String, required: true },
  weakness: { type: String, required: true },
  weapons: [{ type: Schema.Types.OgbjectId, ref: 'weapon' }],
  userID: { type: Schema.Types.ObjectId, required: true },
  categoryID: { type: Schema.Types.ObjectId, required: true },
  superpowers: [{ type: Schema.Types.ObjectId, ref: 'superpower' }],
  imageURI: { type: String, required: true, unique: true },
  objectKey: { type: String, required: true, unique: true },
  created: { type: Date, default: Date.now }
});

module.exports = mongoose.model('character', characterSchema);
